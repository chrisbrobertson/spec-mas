#!/usr/bin/env node

/**
 * Spec-MAS v3 Traceability Matrix Generator
 *
 * Generates requirement traceability matrix mapping requirements to implementations and tests.
 * Provides end-to-end visibility of requirement coverage.
 *
 * Usage:
 *   node scripts/traceability-matrix.js <spec-file> [options]
 *
 * Options:
 *   --impl-dir <path>       Implementation directory (default: src/)
 *   --test-dir <path>       Test directory (default: tests/)
 *   --output <path>         Output report file (default: TRACEABILITY_MATRIX.md)
 *   --format <md|csv|json>  Output format (default: md)
 *   --verbose               Detailed output
 *
 * Examples:
 *   npm run traceability docs/examples/level-3-filter-spec.md
 *   npm run traceability spec.md --format csv --output matrix.csv
 *   npm run traceability spec.md --impl-dir implementation-output
 */

const fs = require('fs');
const path = require('path');
const { parseSpec } = require('./spec-parser');

// ==========================================
// File Discovery
// ==========================================

function findImplementationFiles(implDir) {
  if (!implDir || !fs.existsSync(implDir)) {
    return [];
  }

  const files = [];

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath);
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walkDir(implDir);
  return files;
}

function findTestFiles(testDir) {
  if (!testDir) {
    // Try common test directories
    const testDirs = [
      path.join(process.cwd(), 'tests'),
      path.join(process.cwd(), 'test'),
      path.join(process.cwd(), '__tests__')
    ];

    const allFiles = [];
    for (const dir of testDirs) {
      if (fs.existsSync(dir)) {
        allFiles.push(...findTestFiles(dir));
      }
    }
    return allFiles;
  }

  if (!fs.existsSync(testDir)) {
    return [];
  }

  const files = [];

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        walkDir(fullPath);
      } else if (entry.isFile() && /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walkDir(testDir);
  return files;
}

// ==========================================
// Requirement Extraction
// ==========================================

function extractRequirements(spec) {
  const requirements = [];

  // Extract from functional requirements
  if (spec.sections.functionalRequirements) {
    for (const req of spec.sections.functionalRequirements) {
      requirements.push({
        id: req.id,
        type: 'Functional',
        description: req.description,
        validationCriteria: req.validationCriteria || [],
        source: 'Functional Requirements'
      });
    }
  }

  // Extract from user stories
  if (spec.sections.userStories) {
    for (let i = 0; i < spec.sections.userStories.length; i++) {
      const story = spec.sections.userStories[i];
      requirements.push({
        id: `US-${i + 1}`,
        type: 'User Story',
        description: story,
        validationCriteria: [],
        source: 'User Stories'
      });
    }
  }

  // Extract from acceptance criteria
  if (spec.sections.acceptanceCriteria) {
    for (let i = 0; i < spec.sections.acceptanceCriteria.length; i++) {
      const criterion = spec.sections.acceptanceCriteria[i];
      requirements.push({
        id: `AC-${i + 1}`,
        type: 'Acceptance',
        description: criterion,
        validationCriteria: [],
        source: 'Acceptance Criteria'
      });
    }
  }

  return requirements;
}

// ==========================================
// Implementation Mapping
// ==========================================

function mapImplementations(requirements, implFiles, verbose) {
  const mapping = [];

  for (const req of requirements) {
    const reqMapping = {
      requirement: req,
      implementations: [],
      tests: [],
      status: 'NOT_IMPLEMENTED'
    };

    // Extract keywords from requirement
    const reqId = req.id.toLowerCase();
    const descWords = req.description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    // Search implementation files
    for (const file of implFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8').toLowerCase();
        const relativePath = path.relative(process.cwd(), file);

        // Check for direct requirement ID reference
        if (content.includes(reqId)) {
          reqMapping.implementations.push({
            file: relativePath,
            matchType: 'direct',
            confidence: 'high'
          });
          continue;
        }

        // Check for keyword matches
        const matchedWords = descWords.filter(word => content.includes(word));
        const matchRatio = matchedWords.length / descWords.length;

        if (matchRatio >= 0.4) { // 40% of keywords match
          reqMapping.implementations.push({
            file: relativePath,
            matchType: 'keyword',
            confidence: matchRatio >= 0.6 ? 'high' : 'medium',
            matchedKeywords: matchedWords.slice(0, 3)
          });
        }
      } catch (error) {
        if (verbose) {
          console.error(`Error reading ${file}: ${error.message}`);
        }
      }
    }

    mapping.push(reqMapping);
  }

  return mapping;
}

// ==========================================
// Test Mapping
// ==========================================

function mapTests(mapping, testFiles, verbose) {
  for (const item of mapping) {
    const req = item.requirement;
    const reqId = req.id.toLowerCase();
    const descWords = req.description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    // Search test files
    for (const file of testFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8').toLowerCase();
        const relativePath = path.relative(process.cwd(), file);

        // Check for direct requirement ID reference
        if (content.includes(reqId)) {
          item.tests.push({
            file: relativePath,
            matchType: 'direct',
            confidence: 'high'
          });

          // Extract test names that mention this requirement
          const lines = content.split('\n');
          const testNames = [];

          for (const line of lines) {
            if ((line.includes('it(') || line.includes('test(') || line.includes('describe(')) &&
                line.includes(reqId)) {
              const match = line.match(/['"](.*?)['"]/);
              if (match) {
                testNames.push(match[1]);
              }
            }
          }

          if (testNames.length > 0) {
            item.tests[item.tests.length - 1].testNames = testNames;
          }

          continue;
        }

        // Check for keyword matches
        const matchedWords = descWords.filter(word => content.includes(word));
        const matchRatio = matchedWords.length / descWords.length;

        if (matchRatio >= 0.4) {
          item.tests.push({
            file: relativePath,
            matchType: 'keyword',
            confidence: matchRatio >= 0.6 ? 'high' : 'medium',
            matchedKeywords: matchedWords.slice(0, 3)
          });
        }
      } catch (error) {
        if (verbose) {
          console.error(`Error reading ${file}: ${error.message}`);
        }
      }
    }
  }

  return mapping;
}

// ==========================================
// Status Calculation
// ==========================================

function calculateStatus(mapping) {
  for (const item of mapping) {
    const hasImpl = item.implementations.length > 0;
    const hasTests = item.tests.length > 0;

    if (hasImpl && hasTests) {
      item.status = 'COMPLETE';
    } else if (hasImpl && !hasTests) {
      item.status = 'PARTIAL';
    } else if (!hasImpl && hasTests) {
      item.status = 'TEST_ONLY';
    } else {
      item.status = 'NOT_IMPLEMENTED';
    }

    // Calculate confidence score
    const implConfidence = item.implementations.reduce((sum, impl) => {
      return sum + (impl.confidence === 'high' ? 1 : 0.5);
    }, 0);

    const testConfidence = item.tests.reduce((sum, test) => {
      return sum + (test.confidence === 'high' ? 1 : 0.5);
    }, 0);

    item.confidenceScore = Math.min(100, Math.round((implConfidence + testConfidence) * 25));
  }

  return mapping;
}

// ==========================================
// Summary Statistics
// ==========================================

function calculateSummary(mapping) {
  const summary = {
    total: mapping.length,
    complete: 0,
    partial: 0,
    testOnly: 0,
    notImplemented: 0,
    fullyTraced: 0,
    missingImplementation: 0,
    missingTests: 0,
    byType: {}
  };

  for (const item of mapping) {
    // Count by status
    switch (item.status) {
      case 'COMPLETE':
        summary.complete++;
        summary.fullyTraced++;
        break;
      case 'PARTIAL':
        summary.partial++;
        summary.missingTests++;
        break;
      case 'TEST_ONLY':
        summary.testOnly++;
        summary.missingImplementation++;
        break;
      case 'NOT_IMPLEMENTED':
        summary.notImplemented++;
        summary.missingImplementation++;
        summary.missingTests++;
        break;
    }

    // Count by type
    const type = item.requirement.type;
    if (!summary.byType[type]) {
      summary.byType[type] = { total: 0, complete: 0 };
    }
    summary.byType[type].total++;
    if (item.status === 'COMPLETE') {
      summary.byType[type].complete++;
    }
  }

  summary.traceabilityPercent = summary.total > 0
    ? Math.round((summary.fullyTraced / summary.total) * 100)
    : 0;

  return summary;
}

// ==========================================
// Report Generation - Markdown
// ==========================================

function generateMarkdownReport(mapping, summary, specName) {
  let report = `# Traceability Matrix\n\n`;

  report += `**Specification:** ${specName}\n`;
  report += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n`;

  // Summary
  report += `## Summary\n\n`;
  report += `- **Total Requirements:** ${summary.total}\n`;
  report += `- **Fully Traced:** ${summary.fullyTraced}/${summary.total} (${summary.traceabilityPercent}%)\n`;
  report += `- **Complete:** ${summary.complete} | **Partial:** ${summary.partial} | **Not Implemented:** ${summary.notImplemented}\n`;
  report += `- **Missing Implementation:** ${summary.missingImplementation}\n`;
  report += `- **Missing Tests:** ${summary.missingTests}\n\n`;

  // By type
  if (Object.keys(summary.byType).length > 0) {
    report += `### By Requirement Type\n\n`;
    for (const [type, stats] of Object.entries(summary.byType)) {
      const pct = Math.round((stats.complete / stats.total) * 100);
      report += `- **${type}:** ${stats.complete}/${stats.total} complete (${pct}%)\n`;
    }
    report += '\n';
  }

  // Detailed matrix
  report += `## Detailed Traceability Matrix\n\n`;
  report += `| Req ID | Type | Description | Implementation | Tests | Status |\n`;
  report += `|--------|------|-------------|----------------|-------|--------|\n`;

  for (const item of mapping) {
    const req = item.requirement;
    const desc = req.description.substring(0, 50) + (req.description.length > 50 ? '...' : '');

    const implStatus = item.implementations.length > 0 ? '✓' : '✗';
    const implFiles = item.implementations.length > 0
      ? item.implementations.map(i => i.file).join(', ')
      : '—';

    const testStatus = item.tests.length > 0 ? '✓' : '✗';
    const testFiles = item.tests.length > 0
      ? item.tests.map(t => t.file).join(', ')
      : '—';

    const statusIcon = {
      'COMPLETE': '✓',
      'PARTIAL': '⚠',
      'TEST_ONLY': '⚠',
      'NOT_IMPLEMENTED': '✗'
    }[item.status];

    report += `| ${req.id} | ${req.type} | ${desc} | ${implStatus} ${implFiles.substring(0, 30)} | ${testStatus} ${testFiles.substring(0, 30)} | ${statusIcon} ${item.status} |\n`;
  }

  report += `\n`;

  // Gaps
  const gaps = mapping.filter(item => item.status !== 'COMPLETE');
  if (gaps.length > 0) {
    report += `## Coverage Gaps\n\n`;

    const notImpl = gaps.filter(item => item.status === 'NOT_IMPLEMENTED');
    if (notImpl.length > 0) {
      report += `### Not Implemented (${notImpl.length})\n\n`;
      for (const item of notImpl) {
        report += `- **${item.requirement.id}:** ${item.requirement.description}\n`;
      }
      report += '\n';
    }

    const partial = gaps.filter(item => item.status === 'PARTIAL');
    if (partial.length > 0) {
      report += `### Missing Tests (${partial.length})\n\n`;
      for (const item of partial) {
        report += `- **${item.requirement.id}:** Implemented in ${item.implementations[0].file} but no tests found\n`;
      }
      report += '\n';
    }
  }

  // Implementation details
  report += `## Implementation Details\n\n`;

  for (const item of mapping) {
    if (item.implementations.length === 0 && item.tests.length === 0) {
      continue;
    }

    report += `### ${item.requirement.id}: ${item.requirement.description}\n\n`;

    if (item.implementations.length > 0) {
      report += `**Implementation Files:**\n`;
      for (const impl of item.implementations) {
        report += `- ${impl.file} (${impl.confidence} confidence)\n`;
      }
      report += '\n';
    }

    if (item.tests.length > 0) {
      report += `**Test Files:**\n`;
      for (const test of item.tests) {
        report += `- ${test.file} (${test.confidence} confidence)\n`;
        if (test.testNames && test.testNames.length > 0) {
          for (const name of test.testNames) {
            report += `  - "${name}"\n`;
          }
        }
      }
      report += '\n';
    }
  }

  report += `---\n\n`;
  report += `*Generated by Spec-MAS v3 Traceability Matrix*\n`;

  return report;
}

// ==========================================
// Report Generation - CSV
// ==========================================

function generateCSVReport(mapping) {
  let csv = 'Requirement ID,Type,Description,Implementation Files,Test Files,Status,Confidence\n';

  for (const item of mapping) {
    const req = item.requirement;
    const desc = req.description.replace(/,/g, ';').replace(/"/g, '""');
    const implFiles = item.implementations.map(i => i.file).join(';');
    const testFiles = item.tests.map(t => t.file).join(';');

    csv += `"${req.id}","${req.type}","${desc}","${implFiles}","${testFiles}","${item.status}",${item.confidenceScore}\n`;
  }

  return csv;
}

// ==========================================
// Report Generation - JSON
// ==========================================

function generateJSONReport(mapping, summary, specName) {
  return JSON.stringify({
    specification: specName,
    generated: new Date().toISOString(),
    summary,
    traceability: mapping
  }, null, 2);
}

// ==========================================
// Main Execution
// ==========================================

function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Spec-MAS v3 Traceability Matrix Generator

Usage: node scripts/traceability-matrix.js <spec-file> [options]

Options:
  --impl-dir <path>       Implementation directory (default: src/)
  --test-dir <path>       Test directory (default: tests/)
  --output <path>         Output report file (default: TRACEABILITY_MATRIX.md)
  --format <md|csv|json>  Output format (default: md)
  --verbose               Detailed output

Examples:
  node scripts/traceability-matrix.js docs/examples/level-3-filter-spec.md
  node scripts/traceability-matrix.js spec.md --format csv --output matrix.csv
    `);
    process.exit(0);
  }

  const config = {
    specPath: args[0],
    implDir: null,
    testDir: null,
    output: 'TRACEABILITY_MATRIX.md',
    format: 'md',
    verbose: false
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--impl-dir':
        config.implDir = path.resolve(process.cwd(), args[++i]);
        break;
      case '--test-dir':
        config.testDir = path.resolve(process.cwd(), args[++i]);
        break;
      case '--output':
        config.output = args[++i];
        break;
      case '--format':
        config.format = args[++i];
        break;
      case '--verbose':
        config.verbose = true;
        break;
    }
  }

  return config;
}

function main() {
  const config = parseArguments();

  console.log('════════════════════════════════════════════════════════');
  console.log('  SPEC-MAS TRACEABILITY MATRIX');
  console.log('════════════════════════════════════════════════════════\n');

  // Parse spec
  console.log('Parsing specification...');
  const spec = parseSpec(config.specPath);
  const specName = spec.metadata.name || 'Unknown';
  console.log(`✓ Loaded: ${specName}\n`);

  // Extract requirements
  console.log('Extracting requirements...');
  const requirements = extractRequirements(spec);
  console.log(`✓ Found ${requirements.length} requirements\n`);

  // Find implementation files
  console.log('Finding implementation files...');
  const implDir = config.implDir || path.join(process.cwd(), 'src');
  const implFiles = findImplementationFiles(implDir);
  console.log(`✓ Found ${implFiles.length} implementation files\n`);

  // Find test files
  console.log('Finding test files...');
  const testFiles = findTestFiles(config.testDir);
  console.log(`✓ Found ${testFiles.length} test files\n`);

  // Map implementations
  console.log('Mapping implementations to requirements...');
  let mapping = mapImplementations(requirements, implFiles, config.verbose);
  console.log(`✓ Mapped implementations\n`);

  // Map tests
  console.log('Mapping tests to requirements...');
  mapping = mapTests(mapping, testFiles, config.verbose);
  console.log(`✓ Mapped tests\n`);

  // Calculate status
  console.log('Calculating traceability status...');
  mapping = calculateStatus(mapping);
  const summary = calculateSummary(mapping);
  console.log(`✓ Traceability: ${summary.traceabilityPercent}%\n`);

  // Generate report
  console.log('Generating report...');
  let report;

  switch (config.format) {
    case 'csv':
      report = generateCSVReport(mapping);
      break;
    case 'json':
      report = generateJSONReport(mapping, summary, specName);
      break;
    case 'md':
    default:
      report = generateMarkdownReport(mapping, summary, specName);
      break;
  }

  fs.writeFileSync(config.output, report, 'utf8');
  console.log(`✓ Report saved to: ${config.output}\n`);

  // Summary output
  console.log('════════════════════════════════════════════════════════');
  console.log(`Traceability: ${summary.traceabilityPercent}% (${summary.fullyTraced}/${summary.total})`);
  console.log(`Complete: ${summary.complete} | Partial: ${summary.partial} | Missing: ${summary.notImplemented}`);
  console.log('════════════════════════════════════════════════════════\n');

  // Exit code based on coverage
  if (summary.traceabilityPercent < 100) {
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  extractRequirements,
  mapImplementations,
  mapTests,
  calculateStatus,
  calculateSummary,
  generateMarkdownReport,
  generateCSVReport,
  generateJSONReport
};
