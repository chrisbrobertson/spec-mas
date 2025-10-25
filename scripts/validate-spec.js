#!/usr/bin/env node

/**
 * Spec-MAS v3 Spec Validation Script
 * Main entry point for validating specification files
 */

const fs = require('fs');
const path = require('path');
const { parseSpec, validateStructure } = require('./spec-parser');
const {
  runAllGates,
  getApplicableGates,
  isAgentReady,
  calculateReadinessScore
} = require('../src/validation/gates');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Format colored output
 */
function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

/**
 * Print section header
 */
function printHeader(text) {
  console.log('\n' + colorize('═'.repeat(80), 'cyan'));
  console.log(colorize(`  ${text}`, 'bright'));
  console.log(colorize('═'.repeat(80), 'cyan'));
}

/**
 * Print sub-header
 */
function printSubHeader(text) {
  console.log('\n' + colorize(`─── ${text} ${'─'.repeat(Math.max(0, 75 - text.length))}`, 'blue'));
}

/**
 * Generate human-readable validation report
 */
function generateHumanReport(spec, gateResults, options = {}) {
  const { complexity, maturity } = spec.metadata;
  const applicableGates = getApplicableGates(complexity, maturity);
  const agentReady = isAgentReady(gateResults, complexity, maturity);
  const overallScore = calculateReadinessScore(gateResults);

  printHeader('SPEC VALIDATION REPORT');

  // Metadata section
  console.log('\n' + colorize('Spec Metadata:', 'bright'));
  console.log(`  Name:        ${spec.metadata.name || 'N/A'}`);
  console.log(`  ID:          ${spec.metadata.id || 'N/A'}`);
  console.log(`  Complexity:  ${colorize(complexity || 'N/A', complexity === 'HIGH' ? 'red' : complexity === 'MODERATE' ? 'yellow' : 'green')}`);
  console.log(`  Maturity:    ${colorize(`Level ${maturity || 'N/A'}`, 'cyan')}`);
  console.log(`  File:        ${spec.filePath}`);

  // Gates status
  printSubHeader('Validation Gates Status');

  for (const gateName of ['G1', 'G2', 'G3', 'G4']) {
    const result = gateResults[gateName];
    const isApplicable = applicableGates.includes(gateName);
    const status = !isApplicable
      ? colorize('⊘ N/A', 'gray')
      : result.passed
      ? colorize('✓ PASS', 'green')
      : colorize('✗ FAIL', 'red');

    const score = result.score !== undefined ? colorize(`(${result.score}%)`, 'cyan') : '';

    console.log(`  ${gateName} - ${result.name.padEnd(40)} ${status} ${score}`);

    // Show failed checks
    if (isApplicable && !result.passed && !options.summary) {
      const failedChecks = result.checks.filter(c => !c.passed);
      for (const check of failedChecks) {
        console.log(colorize(`      ${check.message}`, 'red'));
      }
    }
  }

  // Detailed check results
  if (!options.summary) {
    printSubHeader('Detailed Check Results');

    for (const gateName of applicableGates) {
      const result = gateResults[gateName];

      console.log(`\n  ${colorize(gateName + ' - ' + result.name, 'bright')}`);

      for (const check of result.checks) {
        const icon = check.passed ? colorize('✓', 'green') : colorize('✗', 'red');
        console.log(`    ${icon} ${check.name}`);
        if (!check.passed || options.verbose) {
          console.log(colorize(`      ${check.message}`, check.passed ? 'gray' : 'yellow'));
        }
      }
    }
  }

  // Overall status
  printSubHeader('Overall Status');

  console.log(`  Readiness Score:  ${colorize(`${overallScore}/100`, overallScore >= 80 ? 'green' : overallScore >= 60 ? 'yellow' : 'red')}`);
  console.log(`  Agent Ready:      ${agentReady ? colorize('✓ YES', 'green') : colorize('✗ NO', 'red')}`);

  if (!agentReady) {
    console.log('\n' + colorize('  ⚠ Spec is NOT ready for agent implementation', 'yellow'));
    console.log(colorize('  Fix the failed checks above and re-validate', 'yellow'));
  } else {
    console.log('\n' + colorize('  ✓ Spec is ready for agent implementation!', 'green'));
  }

  // Actionable feedback for failures
  if (!agentReady) {
    printSubHeader('Action Items');

    let actionCount = 0;
    for (const gateName of applicableGates) {
      const result = gateResults[gateName];
      if (!result.passed) {
        const failedChecks = result.checks.filter(c => !c.passed);
        for (const check of failedChecks) {
          actionCount++;
          console.log(`  ${actionCount}. ${check.name}`);
          console.log(colorize(`     ${check.message}`, 'yellow'));
        }
      }
    }
  }

  console.log('\n' + colorize('═'.repeat(80), 'cyan') + '\n');
}

/**
 * Generate JSON validation report
 */
function generateJSONReport(spec, gateResults) {
  const { complexity, maturity } = spec.metadata;
  const applicableGates = getApplicableGates(complexity, maturity);
  const agentReady = isAgentReady(gateResults, complexity, maturity);
  const overallScore = calculateReadinessScore(gateResults);

  return {
    metadata: {
      name: spec.metadata.name,
      id: spec.metadata.id,
      complexity,
      maturity,
      file: spec.filePath,
      timestamp: new Date().toISOString()
    },
    gates: gateResults,
    applicableGates,
    summary: {
      agentReady,
      overallScore,
      gatesPassed: Object.keys(gateResults).filter(g => applicableGates.includes(g) && gateResults[g].passed).length,
      totalGates: applicableGates.length
    },
    actionItems: generateActionItems(gateResults, applicableGates)
  };
}

/**
 * Generate action items from failed checks
 */
function generateActionItems(gateResults, applicableGates) {
  const items = [];

  for (const gateName of applicableGates) {
    const result = gateResults[gateName];
    if (!result.passed) {
      const failedChecks = result.checks.filter(c => !c.passed);
      for (const check of failedChecks) {
        items.push({
          gate: gateName,
          check: check.name,
          message: check.message
        });
      }
    }
  }

  return items;
}

/**
 * Main validation function
 */
function validateSpec(filePath, options = {}) {
  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      console.error(colorize(`Error: File not found: ${filePath}`, 'red'));
      process.exit(1);
    }

    // Parse the spec
    const spec = parseSpec(filePath);

    // Run validation gates
    const gateResults = runAllGates(spec);

    // Generate reports
    if (options.json) {
      const jsonReport = generateJSONReport(spec, gateResults);

      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(jsonReport, null, 2));
        console.log(colorize(`✓ JSON report written to: ${options.output}`, 'green'));
      } else {
        console.log(JSON.stringify(jsonReport, null, 2));
      }
    } else {
      generateHumanReport(spec, gateResults, options);
    }

    // Determine exit code
    const { complexity, maturity } = spec.metadata;
    const agentReady = isAgentReady(gateResults, complexity, maturity);

    return agentReady ? 0 : 1;

  } catch (error) {
    console.error(colorize(`\nValidation Error: ${error.message}`, 'red'));
    if (options.verbose) {
      console.error(colorize('\nStack trace:', 'gray'));
      console.error(colorize(error.stack, 'gray'));
    }
    return 1;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options = {
    json: args.includes('--json'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    summary: args.includes('--summary'),
    output: null,
    filePath: null
  };

  // Find output file
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    options.output = args[outputIndex + 1];
  }

  // Find file path (first non-flag argument)
  for (const arg of args) {
    if (!arg.startsWith('--') && !arg.startsWith('-') && arg !== options.output) {
      options.filePath = arg;
      break;
    }
  }

  return options;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
${colorize('Spec-MAS v3 Validation Tool', 'bright')}

${colorize('Usage:', 'cyan')}
  npm run validate-spec <spec-file> [options]
  node scripts/validate-spec.js <spec-file> [options]

${colorize('Arguments:', 'cyan')}
  <spec-file>    Path to the specification markdown file

${colorize('Options:', 'cyan')}
  --json         Output report in JSON format
  --output FILE  Write JSON report to file
  --summary      Show summary only (less verbose)
  --verbose, -v  Show detailed error information
  --help, -h     Show this help message

${colorize('Examples:', 'cyan')}
  npm run validate-spec docs/examples/level-3-filter-spec.md
  npm run validate-spec my-spec.md --json --output report.json
  npm run validate-spec my-spec.md --summary

${colorize('Exit Codes:', 'cyan')}
  0 - Spec passed all applicable validation gates (Agent Ready)
  1 - Spec failed validation or error occurred
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();

  if (!options.filePath) {
    console.error(colorize('Error: No spec file specified', 'red'));
    printUsage();
    process.exit(1);
  }

  const exitCode = validateSpec(options.filePath, options);
  process.exit(exitCode);
}

module.exports = { validateSpec, generateJSONReport, generateHumanReport };
