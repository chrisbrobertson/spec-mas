#!/usr/bin/env node

/**
 * Spec-MAS v3 Code Quality Checker
 *
 * Analyzes code quality, complexity, and maintainability.
 * Checks for code smells, naming conventions, and documentation.
 *
 * Usage:
 *   node scripts/code-quality-check.js [directory] [options]
 *
 * Options:
 *   --dir <path>                Directory to analyze (default: src/)
 *   --complexity-threshold <n>  Max cyclomatic complexity (default: 10)
 *   --max-lines <n>            Max lines per function (default: 50)
 *   --max-file-lines <n>       Max lines per file (default: 300)
 *   --output <path>            Output report file (optional)
 *   --json                     Output in JSON format
 *   --strict                   Fail on any issue
 *   --verbose                  Detailed output
 *
 * Examples:
 *   npm run quality-check
 *   npm run quality-check -- --dir implementation-output
 *   npm run quality-check -- --strict --complexity-threshold 5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==========================================
// File Discovery
// ==========================================

function findSourceFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = [];

  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' ||
            entry.name === '.git' ||
            entry.name === 'dist' ||
            entry.name === 'build' ||
            entry.name === 'coverage' ||
            entry.name.startsWith('.')) {
          continue;
        }
        walkDir(fullPath);
      } else if (entry.isFile()) {
        if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.js') && !entry.name.endsWith('.spec.js')) {
          files.push(fullPath);
        }
      }
    }
  }

  walkDir(dir);
  return files;
}

// ==========================================
// Complexity Analysis
// ==========================================

function calculateCyclomaticComplexity(code) {
  // Simplified cyclomatic complexity calculation
  // M = E - N + 2P where E = edges, N = nodes, P = connected components
  // Approximation: count decision points + 1

  const decisionPatterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bwhile\s*\(/g,
    /\bfor\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /&&/g,
    /\|\|/g,
    /\?\s*.*?\s*:/g  // Ternary operators
  ];

  let complexity = 1;

  for (const pattern of decisionPatterns) {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

function analyzeFunctionComplexity(file, content, threshold) {
  const issues = [];
  const functions = [];

  // Extract functions (simplified - doesn't handle all cases)
  const functionPatterns = [
    /function\s+(\w+)\s*\([^)]*\)\s*{/g,
    /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g,
    /(\w+)\s*:\s*function\s*\([^)]*\)\s*{/g,
    /async\s+function\s+(\w+)\s*\([^)]*\)\s*{/g
  ];

  for (const pattern of functionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const functionName = match[1] || 'anonymous';
      const startIndex = match.index;

      // Find function body
      let braceCount = 1;
      let endIndex = content.indexOf('{', startIndex) + 1;

      while (braceCount > 0 && endIndex < content.length) {
        if (content[endIndex] === '{') braceCount++;
        if (content[endIndex] === '}') braceCount--;
        endIndex++;
      }

      const functionBody = content.substring(startIndex, endIndex);
      const complexity = calculateCyclomaticComplexity(functionBody);

      functions.push({
        name: functionName,
        complexity,
        lines: functionBody.split('\n').length,
        startLine: getLineNumber(content, startIndex)
      });

      if (complexity > threshold) {
        issues.push({
          type: 'high-complexity',
          severity: complexity > threshold * 2 ? 'high' : 'medium',
          file: path.relative(process.cwd(), file),
          function: functionName,
          line: getLineNumber(content, startIndex),
          message: `Function has complexity ${complexity} (threshold: ${threshold})`
        });
      }
    }
  }

  return { functions, issues };
}

// ==========================================
// Code Smell Detection
// ==========================================

function detectCodeSmells(file, content, config) {
  const smells = [];
  const relativePath = path.relative(process.cwd(), file);
  const lines = content.split('\n');

  // 1. Long file
  if (lines.length > config.maxFileLines) {
    smells.push({
      type: 'long-file',
      severity: 'medium',
      file: relativePath,
      message: `File has ${lines.length} lines (max: ${config.maxFileLines})`
    });
  }

  // 2. Long functions
  let functionStart = -1;
  let functionName = '';
  let braceCount = 0;
  let inFunction = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inFunction) {
      const funcMatch = line.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(|(\w+)\s*:\s*function/);
      if (funcMatch) {
        functionName = funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
        functionStart = i;
        inFunction = true;
        braceCount = 0;
      }
    }

    if (inFunction) {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (braceCount === 0 && functionStart !== i) {
        const functionLength = i - functionStart + 1;
        if (functionLength > config.maxLines) {
          smells.push({
            type: 'long-function',
            severity: functionLength > config.maxLines * 2 ? 'high' : 'medium',
            file: relativePath,
            line: functionStart + 1,
            function: functionName,
            message: `Function has ${functionLength} lines (max: ${config.maxLines})`
          });
        }
        inFunction = false;
      }
    }
  }

  // 3. Deep nesting
  let maxNesting = 0;
  let currentNesting = 0;
  let deepNestingLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.match(/^(\s*)/)[1].length;
    const estimatedNesting = Math.floor(indent / 2);

    if (estimatedNesting > maxNesting) {
      maxNesting = estimatedNesting;
      deepNestingLine = i + 1;
    }
  }

  if (maxNesting > 4) {
    smells.push({
      type: 'deep-nesting',
      severity: maxNesting > 6 ? 'high' : 'medium',
      file: relativePath,
      line: deepNestingLine,
      message: `Deep nesting detected (${maxNesting} levels, max: 4)`
    });
  }

  // 4. Too many parameters
  const functionDefs = content.matchAll(/function\s+\w+\s*\(([^)]{50,})\)|const\s+\w+\s*=\s*\(([^)]{50,})\)\s*=>/g);
  for (const match of functionDefs) {
    const params = (match[1] || match[2] || '').split(',').length;
    if (params > 5) {
      smells.push({
        type: 'many-parameters',
        severity: 'medium',
        file: relativePath,
        line: getLineNumber(content, match.index),
        message: `Function has ${params} parameters (max: 5)`
      });
    }
  }

  // 5. Duplicate code (very simplified - just check for repeated long lines)
  const lineFrequency = {};
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length > 40 && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      if (!lineFrequency[trimmed]) {
        lineFrequency[trimmed] = [];
      }
      lineFrequency[trimmed].push(i + 1);
    }
  }

  for (const [line, occurrences] of Object.entries(lineFrequency)) {
    if (occurrences.length >= 3) {
      smells.push({
        type: 'duplicate-code',
        severity: 'low',
        file: relativePath,
        lines: occurrences,
        message: `Similar line repeated ${occurrences.length} times`
      });
      break; // Only report once per file
    }
  }

  // 6. TODO/FIXME comments
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\/\/\s*(TODO|FIXME)/i.test(line)) {
      smells.push({
        type: 'todo-comment',
        severity: 'low',
        file: relativePath,
        line: i + 1,
        message: line.trim()
      });
    }
  }

  // 7. Console.log statements (potential debugging leftovers)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/console\.(log|debug|info|warn|error)/.test(line) && !line.trim().startsWith('//')) {
      smells.push({
        type: 'console-statement',
        severity: 'low',
        file: relativePath,
        line: i + 1,
        message: 'Console statement found (remove before production)'
      });
    }
  }

  return smells;
}

// ==========================================
// Naming Convention Check
// ==========================================

function checkNamingConventions(file, content) {
  const issues = [];
  const relativePath = path.relative(process.cwd(), file);

  // Check variable naming
  const varDeclarations = content.matchAll(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
  for (const match of varDeclarations) {
    const varName = match[1];

    // Single letter (except common loop variables)
    if (varName.length === 1 && !['i', 'j', 'k', 'x', 'y', 'z'].includes(varName)) {
      issues.push({
        type: 'poor-naming',
        severity: 'low',
        file: relativePath,
        line: getLineNumber(content, match.index),
        message: `Single-letter variable name: ${varName}`
      });
    }

    // All uppercase (likely a constant, should be at top)
    if (varName === varName.toUpperCase() && varName.length > 1) {
      // This is fine, it's a constant
    }

    // Contains numbers at the end (often a code smell)
    if (/[a-zA-Z]+\d+$/.test(varName) && !/^[a-z0-9]+[A-Z]/.test(varName)) {
      issues.push({
        type: 'poor-naming',
        severity: 'low',
        file: relativePath,
        line: getLineNumber(content, match.index),
        message: `Variable name with trailing numbers: ${varName}`
      });
    }
  }

  // Check function naming (should be camelCase)
  const functionDeclarations = content.matchAll(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
  for (const match of functionDeclarations) {
    const funcName = match[1];

    if (funcName !== funcName.toLowerCase() && !/^[a-z][a-zA-Z0-9]*$/.test(funcName)) {
      // It's not all lowercase and not camelCase
      if (funcName[0] === funcName[0].toUpperCase()) {
        issues.push({
          type: 'naming-convention',
          severity: 'low',
          file: relativePath,
          line: getLineNumber(content, match.index),
          message: `Function ${funcName} should use camelCase (starts with lowercase)`
        });
      }
    }
  }

  return issues;
}

// ==========================================
// Documentation Check
// ==========================================

function checkDocumentation(file, content) {
  const issues = [];
  const relativePath = path.relative(process.cwd(), file);

  // Count JSDoc comments
  const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;
  const jsdocs = content.match(jsdocPattern) || [];

  // Count exported functions
  const exportedFunctions = content.match(/export\s+(function|const\s+\w+\s*=\s*(\([^)]*\)\s*=>|function))/g) || [];

  const documentationRatio = exportedFunctions.length > 0
    ? jsdocs.length / exportedFunctions.length
    : 1;

  if (documentationRatio < 0.5 && exportedFunctions.length > 0) {
    issues.push({
      type: 'missing-documentation',
      severity: 'low',
      file: relativePath,
      message: `Only ${jsdocs.length} JSDoc comments for ${exportedFunctions.length} exported functions`
    });
  }

  return issues;
}

// ==========================================
// ESLint Integration
// ==========================================

function runESLint(dir, verbose) {
  try {
    const eslintPath = path.join(process.cwd(), 'node_modules', '.bin', 'eslint');

    if (!fs.existsSync(eslintPath)) {
      return {
        executed: false,
        error: 'ESLint not found'
      };
    }

    const output = execSync(`${eslintPath} ${dir} --format json`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const results = JSON.parse(output);

    let totalErrors = 0;
    let totalWarnings = 0;
    const issues = [];

    for (const result of results) {
      totalErrors += result.errorCount || 0;
      totalWarnings += result.warningCount || 0;

      if (result.messages && result.messages.length > 0) {
        for (const msg of result.messages) {
          issues.push({
            file: path.relative(process.cwd(), result.filePath),
            line: msg.line,
            column: msg.column,
            severity: msg.severity === 2 ? 'error' : 'warning',
            rule: msg.ruleId,
            message: msg.message
          });
        }
      }
    }

    return {
      executed: true,
      errors: totalErrors,
      warnings: totalWarnings,
      issues
    };

  } catch (error) {
    if (verbose) {
      console.error(`ESLint error: ${error.message}`);
    }

    // Try to parse output even on error
    try {
      const output = error.stdout || '';
      if (output) {
        const results = JSON.parse(output);
        let totalErrors = 0;
        let totalWarnings = 0;

        for (const result of results) {
          totalErrors += result.errorCount || 0;
          totalWarnings += result.warningCount || 0;
        }

        return {
          executed: true,
          errors: totalErrors,
          warnings: totalWarnings,
          issues: []
        };
      }
    } catch (e) {
      // Ignore
    }

    return {
      executed: false,
      error: 'ESLint execution failed'
    };
  }
}

// ==========================================
// Helper Functions
// ==========================================

function getLineNumber(content, index) {
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

// ==========================================
// Report Generation
// ==========================================

function generateReport(analysis, format = 'text') {
  if (format === 'json') {
    return JSON.stringify(analysis, null, 2);
  }

  // Text format
  let report = '';

  report += '════════════════════════════════════════════════════════\n';
  report += '  CODE QUALITY REPORT\n';
  report += '════════════════════════════════════════════════════════\n\n';

  report += `Analyzed: ${analysis.filesAnalyzed} files\n`;
  report += `Total Lines: ${analysis.totalLines}\n\n`;

  // Complexity
  report += '─── Complexity ──────────────────────────────────────────\n';

  if (analysis.complexityStats.functions > 0) {
    report += `  Average: ${analysis.complexityStats.average.toFixed(1)} `;
    report += analysis.complexityStats.average <= 5 ? '(✓ Excellent)\n' :
              analysis.complexityStats.average <= 10 ? '(✓ Good)\n' :
              analysis.complexityStats.average <= 20 ? '(⚠ Fair)\n' :
              '(✗ Poor)\n';

    report += `  Max: ${analysis.complexityStats.max} `;
    report += analysis.complexityStats.max <= 10 ? '(✓ Good)\n' :
              analysis.complexityStats.max <= 20 ? '(⚠ High)\n' :
              '(✗ Very High)\n';

    report += `  Functions: ${analysis.complexityStats.functions}\n`;
  } else {
    report += '  ⊘ No functions analyzed\n';
  }

  if (analysis.complexityIssues.length > 0) {
    report += `\n  High Complexity Functions (${analysis.complexityIssues.length}):\n`;
    for (const issue of analysis.complexityIssues.slice(0, 5)) {
      report += `    - ${issue.file}:${issue.line} ${issue.function} (${issue.message})\n`;
    }
    if (analysis.complexityIssues.length > 5) {
      report += `    ... and ${analysis.complexityIssues.length - 5} more\n`;
    }
  }

  report += '\n';

  // Code Smells
  report += '─── Code Smells ─────────────────────────────────────────\n';

  if (analysis.codeSmells.length === 0) {
    report += '  ✓ No significant code smells detected\n';
  } else {
    const smellsByType = {};
    for (const smell of analysis.codeSmells) {
      if (!smellsByType[smell.type]) smellsByType[smell.type] = [];
      smellsByType[smell.type].push(smell);
    }

    report += `  ⚠ ${analysis.codeSmells.length} issues found\n\n`;

    for (const [type, smells] of Object.entries(smellsByType)) {
      const displayName = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      report += `  ${displayName} (${smells.length}):\n`;

      for (const smell of smells.slice(0, 3)) {
        report += `    - ${smell.file}`;
        if (smell.line) report += `:${smell.line}`;
        if (smell.function) report += ` ${smell.function}`;
        report += ` - ${smell.message}\n`;
      }

      if (smells.length > 3) {
        report += `    ... and ${smells.length - 3} more\n`;
      }
      report += '\n';
    }
  }

  // Naming Conventions
  if (analysis.namingIssues.length > 0) {
    report += '─── Naming Conventions ──────────────────────────────────\n';
    report += `  ⚠ ${analysis.namingIssues.length} issues found\n\n`;

    for (const issue of analysis.namingIssues.slice(0, 5)) {
      report += `    - ${issue.file}:${issue.line} ${issue.message}\n`;
    }

    if (analysis.namingIssues.length > 5) {
      report += `    ... and ${analysis.namingIssues.length - 5} more\n`;
    }

    report += '\n';
  }

  // Documentation
  report += '─── Documentation ───────────────────────────────────────\n';

  if (analysis.documentationIssues.length === 0) {
    report += '  ✓ Documentation coverage is adequate\n';
  } else {
    report += `  ⚠ ${analysis.documentationIssues.length} files with missing documentation\n\n`;

    for (const issue of analysis.documentationIssues.slice(0, 5)) {
      report += `    - ${issue.file}: ${issue.message}\n`;
    }

    if (analysis.documentationIssues.length > 5) {
      report += `    ... and ${analysis.documentationIssues.length - 5} more\n`;
    }
  }

  report += '\n';

  // ESLint
  report += '─── ESLint ──────────────────────────────────────────────\n';

  if (!analysis.eslint.executed) {
    report += `  ⊘ ${analysis.eslint.error}\n`;
  } else if (analysis.eslint.errors === 0 && analysis.eslint.warnings === 0) {
    report += '  ✓ No issues detected\n';
  } else {
    const status = analysis.eslint.errors > 0 ? '✗' : '⚠';
    report += `  ${status} ${analysis.eslint.errors} errors, ${analysis.eslint.warnings} warnings\n`;

    if (analysis.eslint.issues.length > 0) {
      report += '\n  Top Issues:\n';
      for (const issue of analysis.eslint.issues.slice(0, 5)) {
        report += `    - ${issue.file}:${issue.line} [${issue.severity}] ${issue.message}\n`;
      }
    }
  }

  report += '\n';

  // Overall Score
  report += '════════════════════════════════════════════════════════\n';

  const score = calculateQualityScore(analysis);
  let scoreLabel = 'Excellent';
  if (score < 5) scoreLabel = 'Poor';
  else if (score < 6.5) scoreLabel = 'Fair';
  else if (score < 8) scoreLabel = 'Good';

  report += `Overall Quality Score: ${score.toFixed(1)}/10 (${scoreLabel})\n`;
  report += '════════════════════════════════════════════════════════\n';

  return report;
}

function calculateQualityScore(analysis) {
  let score = 10;

  // Deduct for complexity
  if (analysis.complexityStats.average > 10) {
    score -= (analysis.complexityStats.average - 10) * 0.2;
  }
  if (analysis.complexityStats.max > 20) {
    score -= 1;
  }

  // Deduct for code smells
  score -= Math.min(2, analysis.codeSmells.filter(s => s.severity === 'high').length * 0.5);
  score -= Math.min(1, analysis.codeSmells.filter(s => s.severity === 'medium').length * 0.2);

  // Deduct for ESLint issues
  if (analysis.eslint.executed) {
    score -= Math.min(2, analysis.eslint.errors * 0.2);
    score -= Math.min(1, analysis.eslint.warnings * 0.05);
  }

  // Deduct for documentation
  score -= Math.min(1, analysis.documentationIssues.length * 0.2);

  return Math.max(0, Math.min(10, score));
}

// ==========================================
// Main Execution
// ==========================================

function parseArguments() {
  const args = process.argv.slice(2);

  const config = {
    dir: null,
    complexityThreshold: 10,
    maxLines: 50,
    maxFileLines: 300,
    output: null,
    json: false,
    strict: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        console.log(`
Spec-MAS v3 Code Quality Checker

Usage: node scripts/code-quality-check.js [options]

Options:
  --dir <path>                Directory to analyze (default: src/)
  --complexity-threshold <n>  Max cyclomatic complexity (default: 10)
  --max-lines <n>            Max lines per function (default: 50)
  --max-file-lines <n>       Max lines per file (default: 300)
  --output <path>            Output report file (optional)
  --json                     Output in JSON format
  --strict                   Fail on any issue
  --verbose                  Detailed output

Examples:
  node scripts/code-quality-check.js
  node scripts/code-quality-check.js --dir implementation-output
  node scripts/code-quality-check.js --strict --complexity-threshold 5
        `);
        process.exit(0);
        break;
      case '--dir':
        config.dir = path.resolve(process.cwd(), args[++i]);
        break;
      case '--complexity-threshold':
        config.complexityThreshold = parseInt(args[++i]);
        break;
      case '--max-lines':
        config.maxLines = parseInt(args[++i]);
        break;
      case '--max-file-lines':
        config.maxFileLines = parseInt(args[++i]);
        break;
      case '--output':
        config.output = args[++i];
        break;
      case '--json':
        config.json = true;
        break;
      case '--strict':
        config.strict = true;
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
  console.log('  SPEC-MAS CODE QUALITY CHECKER');
  console.log('════════════════════════════════════════════════════════\n');

  // Determine directory
  const analyzeDir = config.dir || path.join(process.cwd(), 'src');

  if (!fs.existsSync(analyzeDir)) {
    console.error(`Error: Directory not found: ${analyzeDir}`);
    process.exit(1);
  }

  console.log(`Analyzing directory: ${path.relative(process.cwd(), analyzeDir)}\n`);

  // Find files
  console.log('Finding source files...');
  const files = findSourceFiles(analyzeDir);
  console.log(`✓ Found ${files.length} files\n`);

  // Initialize analysis
  const analysis = {
    filesAnalyzed: files.length,
    totalLines: 0,
    complexityStats: {
      average: 0,
      max: 0,
      functions: 0
    },
    complexityIssues: [],
    codeSmells: [],
    namingIssues: [],
    documentationIssues: [],
    eslint: { executed: false }
  };

  // Analyze each file
  console.log('Analyzing code quality...');

  let totalComplexity = 0;
  let functionCount = 0;
  let maxComplexity = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    analysis.totalLines += lines.length;

    // Complexity
    const { functions, issues } = analyzeFunctionComplexity(file, content, config.complexityThreshold);
    for (const func of functions) {
      totalComplexity += func.complexity;
      functionCount++;
      if (func.complexity > maxComplexity) {
        maxComplexity = func.complexity;
      }
    }
    analysis.complexityIssues.push(...issues);

    // Code smells
    const smells = detectCodeSmells(file, content, config);
    analysis.codeSmells.push(...smells);

    // Naming conventions
    const namingIssues = checkNamingConventions(file, content);
    analysis.namingIssues.push(...namingIssues);

    // Documentation
    const docIssues = checkDocumentation(file, content);
    analysis.documentationIssues.push(...docIssues);
  }

  analysis.complexityStats = {
    average: functionCount > 0 ? totalComplexity / functionCount : 0,
    max: maxComplexity,
    functions: functionCount
  };

  console.log(`✓ Analyzed complexity and code smells\n`);

  // Run ESLint
  console.log('Running ESLint...');
  analysis.eslint = runESLint(analyzeDir, config.verbose);
  if (analysis.eslint.executed) {
    console.log(`✓ ESLint: ${analysis.eslint.errors} errors, ${analysis.eslint.warnings} warnings\n`);
  } else {
    console.log(`⊘ ${analysis.eslint.error}\n`);
  }

  // Generate report
  console.log('Generating report...');
  const report = generateReport(analysis, config.json ? 'json' : 'text');

  // Output report
  if (config.output) {
    fs.writeFileSync(config.output, report, 'utf8');
    console.log(`✓ Report saved to: ${config.output}\n`);
  } else {
    console.log(report);
  }

  // Determine exit code
  const score = calculateQualityScore(analysis);
  const hasErrors = analysis.eslint.executed && analysis.eslint.errors > 0;
  const hasCriticalIssues = analysis.complexityIssues.some(i => i.severity === 'high') ||
                           analysis.codeSmells.some(s => s.severity === 'high');

  if (hasErrors) {
    console.log('\n✗ Quality check failed: ESLint errors detected\n');
    process.exit(1);
  }

  if (config.strict && (hasCriticalIssues || score < 7)) {
    console.log('\n✗ Quality check failed: Issues detected in strict mode\n');
    process.exit(1);
  }

  console.log('\n✓ Quality check complete\n');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  findSourceFiles,
  calculateCyclomaticComplexity,
  analyzeFunctionComplexity,
  detectCodeSmells,
  checkNamingConventions,
  checkDocumentation,
  runESLint,
  generateReport,
  calculateQualityScore
};
