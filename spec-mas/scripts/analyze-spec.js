#!/usr/bin/env node

/**
 * Spec-MAS Architecture Analysis CLI
 * Analyzes specifications and recommends splitting when appropriate
 */

const fs = require('fs');
const path = require('path');
const { parseSpec } = require('./spec-parser');
const { analyzeSpec, formatAnalysisReport } = require('../src/architecture/spec-analyzer');

// ANSI color codes
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

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

/**
 * Analyze a spec file
 */
function analyzeSpecFile(filePath, options = {}) {
  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      console.error(colorize(`Error: File not found: ${filePath}`, 'red'));
      process.exit(1);
    }

    // Parse the spec
    console.log(colorize(`\nAnalyzing: ${filePath}`, 'cyan'));
    console.log(colorize('─'.repeat(80), 'gray'));
    
    const spec = parseSpec(filePath);
    const analysis = analyzeSpec(spec);

    // Output results
    if (options.json) {
      const jsonReport = {
        file: filePath,
        metadata: spec.metadata,
        analysis
      };
      
      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(jsonReport, null, 2));
        console.log(colorize(`\n✓ JSON report written to: ${options.output}`, 'green'));
      } else {
        console.log(JSON.stringify(jsonReport, null, 2));
      }
    } else {
      const report = formatAnalysisReport(analysis);
      console.log(report);
      
      if (options.output) {
        fs.writeFileSync(options.output, report);
        console.log(colorize(`\n✓ Report written to: ${options.output}`, 'green'));
      }
    }

    // Provide actionable next steps
    if (!options.json && analysis.shouldSplit) {
      console.log(colorize('\n📋 NEXT STEPS:', 'bright'));
      console.log('');
      console.log('1. Review the recommendations above');
      console.log('2. Identify natural boundaries in your specification');
      console.log('3. Create separate spec files for each identified concern');
      console.log('4. Use the template: cp specs/TEMPLATE-STARTUP.md specs/features/new-spec.md');
      console.log('5. Add cross-references between related specs');
      console.log('6. Validate each new spec individually');
      console.log('');
    }

    return analysis.shouldSplit ? 1 : 0;

  } catch (error) {
    console.error(colorize(`\nAnalysis Error: ${error.message}`, 'red'));
    if (options.verbose) {
      console.error(colorize('\nStack trace:', 'gray'));
      console.error(colorize(error.stack, 'gray'));
    }
    return 2;
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
${colorize('Spec-MAS Architecture Analysis Tool', 'bright')}

${colorize('Usage:', 'cyan')}
  npm run analyze-spec <spec-file> [options]
  node scripts/analyze-spec.js <spec-file> [options]

${colorize('Description:', 'cyan')}
  Analyzes a specification to determine if it should be split into smaller,
  more focused specifications. Considers complexity, cohesion, and size factors.

${colorize('Arguments:', 'cyan')}
  <spec-file>    Path to the specification markdown file

${colorize('Options:', 'cyan')}
  --json         Output report in JSON format
  --output FILE  Write report to file
  --verbose, -v  Show detailed error information
  --help, -h     Show this help message

${colorize('Examples:', 'cyan')}
  npm run analyze-spec specs/features/my-feature.md
  npm run analyze-spec specs/features/my-feature.md --json --output analysis.json
  node scripts/analyze-spec.js specs/features/my-feature.md

${colorize('Exit Codes:', 'cyan')}
  0 - Spec does not need splitting
  1 - Spec should be split (recommendations provided)
  2 - Error occurred during analysis

${colorize('Integration with Validation:', 'cyan')}
  This tool complements the validation system. Run this BEFORE final validation
  to ensure your spec is appropriately scoped. After splitting (if needed),
  validate each new spec individually.

${colorize('Workflow:', 'cyan')}
  1. Create initial spec
  2. Run analyze-spec to check if splitting is needed
  3. If needed, split into smaller specs
  4. Validate each spec with: npm run validate-spec
  5. Proceed to implementation
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

  const exitCode = analyzeSpecFile(options.filePath, options);
  process.exit(exitCode);
}

module.exports = { analyzeSpecFile };
