#!/usr/bin/env node

/**
 * Spec-MAS v3 AI Test Enhancement
 *
 * Uses Claude API to enhance test scaffolds with actual test implementations.
 * Fills in TODO sections with realistic test data, proper mocking, and complete assertions.
 *
 * Usage:
 *   node scripts/ai-enhance-tests.js <test-file-or-directory> [options]
 *
 * Options:
 *   --spec <path>        Path to original spec file (for context)
 *   --model <model>      AI model (overrides provider defaults)
 *   --dry-run            Show what would be done without making changes
 *   --verbose            Verbose logging
 *
 * Environment Variables:
 *   AI_PROVIDER          AI provider: 'claude' or 'openai' (default: claude)
 *   OPENAI_API_KEY       OpenAI API key (required if using OpenAI)
 *
 * Examples:
 *   npm run generate-tests:ai tests/unit/product-filter.test.js --spec spec.md
 *   node scripts/ai-enhance-tests.js tests/ --spec docs/examples/level-5-auth-spec.md
 */

const fs = require('fs');
const path = require('path');
const { callAI, calculateCost } = require('./ai-helper');

// ==========================================
// Command Line Arguments
// ==========================================

function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Spec-MAS v3 AI Test Enhancement

Usage: node scripts/ai-enhance-tests.js <test-file-or-directory> [options]

Options:
  --spec <path>     Path to original spec file (provides context)
  --model <model>   AI model to use (overrides provider defaults)
  --dry-run         Preview changes without writing files
  --verbose         Enable verbose logging

Environment:
  AI_PROVIDER        AI provider: 'claude' or 'openai' (default: claude)
  AI_MODEL_CLAUDE    Claude model (default: claude-3-5-sonnet-20241022)
  AI_MODEL_OPENAI    OpenAI model (default: gpt-4)
  OPENAI_API_KEY     OpenAI API key (required if using OpenAI)

Setup:
  For Claude CLI: npm install -g @anthropic-ai/cli && claude config set api-key YOUR_KEY
  For OpenAI: Add OPENAI_API_KEY to .env file

Examples:
  node scripts/ai-enhance-tests.js tests/unit/feature.test.js --spec spec.md
  node scripts/ai-enhance-tests.js tests/ --spec spec.md --dry-run
    `);
    process.exit(0);
  }

  const config = {
    target: args[0],
    specPath: null,
    provider: process.env.AI_PROVIDER || 'claude',
    model: null, // Will be determined by provider
    dryRun: false,
    verbose: false
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--spec':
        config.specPath = args[++i];
        break;
      case '--model':
        config.model = args[++i];
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
    }
  }

  // Validate AI provider is configured
  const provider = config.provider;

  if (provider === 'claude') {
    console.log('ℹ️  AI Provider: Claude CLI');
  } else if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Error: OPENAI_API_KEY environment variable not set');
      console.error('   Set it in .env file or export OPENAI_API_KEY=your-key');
      process.exit(1);
    }
    console.log('ℹ️  AI Provider: OpenAI (ChatGPT)');
  } else {
    console.error(`❌ Error: Unknown AI provider: ${provider}`);
    console.error('   Valid providers: claude, openai');
    process.exit(1);
  }

  return config;
}

// ==========================================
// File Discovery
// ==========================================

function findTestFiles(target) {
  const files = [];

  if (fs.statSync(target).isDirectory()) {
    const entries = fs.readdirSync(target);

    for (const entry of entries) {
      const fullPath = path.join(target, entry);

      if (fs.statSync(fullPath).isDirectory()) {
        files.push(...findTestFiles(fullPath));
      } else if (entry.endsWith('.test.js') || entry.endsWith('.spec.js')) {
        files.push(fullPath);
      }
    }
  } else if (target.endsWith('.test.js') || target.endsWith('.spec.js')) {
    files.push(target);
  }

  return files;
}

// ==========================================
// Test Enhancement
// ==========================================

function extractTODOSections(testContent) {
  const sections = [];
  const lines = testContent.split('\n');

  let currentSection = null;
  let currentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find TODO comments
    if (line.includes('// TODO:')) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        line: i,
        todo: line.trim(),
        context: lines.slice(Math.max(0, i - 5), i).join('\n'),
        start: i
      };
    }

    // Find end of TODO section (next test or end of block)
    if (currentSection && (
      line.includes('it(') ||
      line.includes('describe(') ||
      line.includes('});')
    )) {
      currentSection.end = i;
      currentSection.code = lines.slice(currentSection.start, i).join('\n');
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

async function enhanceTestSection(section, specContext, testContext, config) {
  const systemPrompt = `You are a test automation expert. Provide implementation code to replace TODO comments in test files.`;

  const userPrompt = `I have a test file with TODO sections that need implementation.

SPECIFICATION CONTEXT:
${specContext || 'No spec provided'}

TEST FILE CONTEXT:
${testContext}

TODO SECTION TO IMPLEMENT:
${section.todo}

SURROUNDING CODE:
${section.context}

Please provide ONLY the implementation code to replace the TODO comment. Include:
1. Proper test data and fixtures
2. Realistic mocking if needed
3. Complete assertions that validate the spec requirements
4. Comments explaining non-obvious test logic

Format your response as JavaScript code only, no markdown or explanations.
The code should be ready to insert directly into the test file.`;

  try {
    const model = config.model ||
                  (config.provider === 'claude'
                    ? (process.env.AI_MODEL_CLAUDE || 'claude-3-5-sonnet-20241022')
                    : (process.env.AI_MODEL_OPENAI || 'gpt-4'));

    const response = await callAI(systemPrompt, userPrompt, {
      provider: config.provider,
      model,
      maxTokens: 2048,
      fallback: process.env.AI_FALLBACK_ENABLED === 'true'
    });

    const implementation = response.content.trim();

    // Clean up any markdown code blocks
    const cleaned = implementation
      .replace(/```javascript\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return cleaned;
  } catch (error) {
    console.error(`   ❌ Error calling AI: ${error.message}`);
    return null;
  }
}

async function enhanceTestFile(filePath, specContext, config) {
  console.log(`\n  📝 Processing: ${filePath}`);

  const testContent = fs.readFileSync(filePath, 'utf8');

  // Extract TODO sections
  const todoSections = extractTODOSections(testContent);

  if (todoSections.length === 0) {
    console.log(`     ℹ️  No TODO sections found, skipping`);
    return { enhanced: false };
  }

  console.log(`     Found ${todoSections.length} TODO sections`);

  // Enhance each section
  let enhancedContent = testContent;
  let successCount = 0;
  let totalTokens = 0;

  for (let i = 0; i < todoSections.length; i++) {
    const section = todoSections[i];

    console.log(`     [${i + 1}/${todoSections.length}] ${section.todo}`);

    if (config.dryRun) {
      console.log(`       (dry-run: would enhance this section)`);
      continue;
    }

    const implementation = await enhanceTestSection(
      section,
      specContext,
      testContent,
      config
    );

    if (implementation) {
      // Replace TODO with implementation
      enhancedContent = enhancedContent.replace(
        section.todo,
        `// AI-generated implementation (review required)\n${implementation}`
      );

      successCount++;

      if (config.verbose) {
        console.log(`       ✅ Enhanced (${implementation.split('\n').length} lines)`);
      } else {
        console.log(`       ✅ Enhanced`);
      }
    } else {
      console.log(`       ⚠️  Failed to enhance`);
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Write enhanced file
  if (!config.dryRun && successCount > 0) {
    // Create backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, testContent);

    // Write enhanced version
    fs.writeFileSync(filePath, enhancedContent);

    console.log(`     ✅ Enhanced ${successCount}/${todoSections.length} sections`);
    console.log(`     💾 Backup saved: ${backupPath}`);
  }

  return {
    enhanced: true,
    totalSections: todoSections.length,
    enhancedSections: successCount,
    tokens: totalTokens
  };
}

// ==========================================
// Main Enhancement Logic
// ==========================================

async function enhanceTests(config) {
  console.log('🤖 Spec-MAS AI Test Enhancement\n');

  if (config.verbose) {
    console.log('Configuration:', JSON.stringify(config, null, 2), '\n');
  }

  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  // Load spec context if provided
  let specContext = null;
  if (config.specPath) {
    if (fs.existsSync(config.specPath)) {
      specContext = fs.readFileSync(config.specPath, 'utf8');
      console.log(`📄 Loaded spec context: ${config.specPath}\n`);
    } else {
      console.log(`⚠️  Spec file not found: ${config.specPath}`);
      console.log(`   Continuing without spec context\n`);
    }
  }

  // Find test files
  console.log(`🔍 Finding test files in: ${config.target}`);

  if (!fs.existsSync(config.target)) {
    console.error(`❌ Error: Target not found: ${config.target}`);
    process.exit(1);
  }

  const testFiles = findTestFiles(config.target);

  if (testFiles.length === 0) {
    console.log(`⚠️  No test files found`);
    process.exit(0);
  }

  console.log(`✅ Found ${testFiles.length} test file(s)`);

  // Enhance each file
  let totalEnhanced = 0;
  let totalSections = 0;
  let totalTokens = 0;

  for (const testFile of testFiles) {
    const result = await enhanceTestFile(testFile, specContext, config);

    if (result.enhanced) {
      totalEnhanced++;
      totalSections += result.enhancedSections || 0;
      totalTokens += result.tokens || 0;
    }
  }

  // Summary
  console.log(`\n✨ AI Test Enhancement Complete!\n`);
  console.log(`Summary:`);
  console.log(`  📊 Test files processed: ${testFiles.length}`);
  console.log(`  ✅ Files enhanced: ${totalEnhanced}`);
  console.log(`  🧪 Sections enhanced: ${totalSections}`);

  if (totalTokens > 0) {
    const estimatedCost = (totalTokens / 1000000) * 3.0; // Rough estimate
    console.log(`  💰 Estimated cost: $${estimatedCost.toFixed(2)}`);
  }

  console.log(`\nNext steps:`);
  console.log(`  1. Review AI-generated code (marked with comments)`);
  console.log(`  2. Test the enhanced test files`);
  console.log(`  3. Restore from .backup files if needed`);
  console.log(`  4. Remove .backup files once satisfied`);

  if (config.dryRun) {
    console.log(`\nRun without --dry-run to apply changes`);
  }

  console.log('');

  return {
    success: true,
    filesProcessed: testFiles.length,
    filesEnhanced: totalEnhanced,
    sectionsEnhanced: totalSections
  };
}

// ==========================================
// CLI Entry Point
// ==========================================

if (require.main === module) {
  const config = parseArguments();

  enhanceTests(config)
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error.message);
      if (config && config.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

module.exports = {
  enhanceTests,
  enhanceTestFile
};
