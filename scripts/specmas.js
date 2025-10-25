#!/usr/bin/env node

/**
 * Spec-MAS v3.0 - Unified CLI
 * Main command-line interface for the complete spec-to-code pipeline
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');

// Import utilities
const { runPipeline, resumePipeline } = require('./pipeline-orchestrator');
const { ConfigManager } = require('./config-manager');
const { estimateCost } = require('./cost-estimator');
const { initProject } = require('./init-project');

// Package info
const packageJson = require('../package.json');
const version = packageJson.version;

// Color utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

// Initialize config manager
const configManager = new ConfigManager();

// Main program
program
  .name('specmas')
  .description('Spec-MAS - Specification-driven development pipeline')
  .version(version);

// ============================================================================
// MAIN PIPELINE COMMAND
// ============================================================================

program
  .command('run <spec-file>')
  .description('Run the complete spec-to-code pipeline')
  .option('--skip-validation', 'Skip spec validation phase')
  .option('--skip-review', 'Skip adversarial review phase')
  .option('--skip-tests', 'Skip test generation phase')
  .option('--skip-implementation', 'Skip code implementation phase')
  .option('--skip-integration', 'Skip code integration phase')
  .option('--skip-qa', 'Skip QA validation phase')
  .option('--dry-run', 'Show what would happen without executing')
  .option('--budget <amount>', 'Set maximum API cost budget in dollars', '50')
  .option('--output-dir <dir>', 'Output directory for generated code', 'implementation-output')
  .option('--resume', 'Resume from last checkpoint')
  .option('--parallel', 'Run implementation tasks in parallel (faster but more expensive)')
  .option('--no-git', 'Skip git operations')
  .option('-y, --yes', 'Skip all confirmations')
  .action(async (specFile, options) => {
    try {
      // Validate spec file exists
      const specPath = path.resolve(specFile);
      if (!fs.existsSync(specPath)) {
        console.error(colorize(`\n✗ Error: Spec file not found: ${specFile}\n`, 'red'));
        process.exit(1);
      }

      // Load config
      const config = configManager.getConfig();

      // Check for API key
      if (!process.env.ANTHROPIC_API_KEY && !config.api.anthropic_key) {
        console.error(colorize('\n✗ Error: ANTHROPIC_API_KEY not found', 'red'));
        console.log('\nSet it with:');
        console.log('  export ANTHROPIC_API_KEY=your-key-here');
        console.log('  or');
        console.log('  specmas config api.anthropic_key your-key-here\n');
        process.exit(1);
      }

      // Handle resume
      if (options.resume) {
        await resumePipeline(specPath, options);
      } else {
        await runPipeline(specPath, options, config);
      }

    } catch (error) {
      console.error(colorize(`\n✗ Pipeline failed: ${error.message}\n`, 'red'));
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// ============================================================================
// INDIVIDUAL PHASE COMMANDS
// ============================================================================

program
  .command('validate <spec-file>')
  .description('Validate spec structure and completeness')
  .option('--strict', 'Use strict validation mode')
  .action(async (specFile, options) => {
    try {
      const { execSync } = require('child_process');
      const args = options.strict ? '--strict' : '';
      execSync(`node ${path.join(__dirname, 'validate-spec.js')} ${specFile} ${args}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command('review <spec-file>')
  .description('Run adversarial reviews on spec')
  .option('--reviewers <list>', 'Comma-separated list of reviewers')
  .option('--parallel', 'Run reviewers in parallel')
  .action(async (specFile, options) => {
    try {
      const { execSync } = require('child_process');
      let args = '';
      if (options.reviewers) args += `--reviewers ${options.reviewers} `;
      if (options.parallel) args += '--parallel ';
      execSync(`node ${path.join(__dirname, 'review-spec.js')} ${specFile} ${args}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command('generate-tests <spec-file>')
  .description('Generate test scaffolds from spec')
  .option('--type <type>', 'Test type: unit, integration, e2e, or all', 'all')
  .option('--ai', 'Use AI to enhance test implementations')
  .action(async (specFile, options) => {
    try {
      const { execSync } = require('child_process');
      let args = '';
      if (options.type !== 'all') args += `--type ${options.type} `;
      if (options.ai) args += '--ai ';
      execSync(`node ${path.join(__dirname, 'generate-tests.js')} ${specFile} ${args}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command('implement <spec-file>')
  .description('Implement spec using AI agents')
  .option('--dry-run', 'Show task breakdown without implementing')
  .option('--parallel', 'Run tasks in parallel')
  .option('--output-dir <dir>', 'Output directory', 'implementation-output')
  .action(async (specFile, options) => {
    try {
      const { execSync } = require('child_process');
      let args = '';
      if (options.dryRun) args += '--dry-run ';
      if (options.parallel) args += '--parallel ';
      if (options.outputDir) args += `--output-dir ${options.outputDir} `;
      execSync(`node ${path.join(__dirname, 'implement-spec.js')} ${specFile} ${args}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command('integrate [output-dir]')
  .description('Integrate generated code into project')
  .option('--check-only', 'Only check for conflicts without integrating')
  .action(async (outputDir, options) => {
    try {
      const { execSync } = require('child_process');
      const dir = outputDir || 'implementation-output';
      const args = options.checkOnly ? '--check-only' : '';
      execSync(`node ${path.join(__dirname, 'code-integration.js')} ${dir} ${args}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command('qa <spec-file>')
  .description('Run QA validation on implementation')
  .option('--strict', 'Use strict validation mode')
  .option('--report-only', 'Generate report without failing')
  .action(async (specFile, options) => {
    try {
      const { execSync } = require('child_process');
      let args = '';
      if (options.strict) args += '--strict ';
      if (options.reportOnly) args += '--report-only ';
      execSync(`node ${path.join(__dirname, 'validate-implementation.js')} ${specFile} ${args}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      process.exit(1);
    }
  });

// ============================================================================
// UTILITY COMMANDS
// ============================================================================

program
  .command('init [project-name]')
  .description('Initialize a new Spec-MAS project')
  .option('--template <name>', 'Project template to use')
  .action(async (projectName, options) => {
    try {
      await initProject(projectName, options);
    } catch (error) {
      console.error(colorize(`\n✗ Initialization failed: ${error.message}\n`, 'red'));
      process.exit(1);
    }
  });

program
  .command('status <spec-file>')
  .description('Show pipeline status for spec')
  .action(async (specFile) => {
    try {
      const { PipelineOrchestrator } = require('./pipeline-orchestrator');
      const orchestrator = new PipelineOrchestrator(specFile, {});
      const status = orchestrator.getStatus();

      console.log('\n' + colorize('═'.repeat(60), 'cyan'));
      console.log(colorize('  PIPELINE STATUS', 'bright'));
      console.log(colorize('═'.repeat(60), 'cyan') + '\n');

      console.log(`Spec: ${path.basename(specFile)}`);
      console.log(`Status: ${status.status}`);
      console.log(`Current Phase: ${status.currentPhase || 'Not started'}`);
      console.log(`Completed Phases: ${status.completedPhases.length}/${status.totalPhases}`);

      if (status.costs.total > 0) {
        console.log(`\nTotal Cost: $${status.costs.total.toFixed(2)}`);
      }

      if (status.completedPhases.length > 0) {
        console.log('\nCompleted:');
        status.completedPhases.forEach(phase => {
          console.log(`  ${colorize('✓', 'green')} ${phase}`);
        });
      }

      if (status.pendingPhases.length > 0) {
        console.log('\nPending:');
        status.pendingPhases.forEach(phase => {
          console.log(`  ${colorize('○', 'gray')} ${phase}`);
        });
      }

      console.log();

    } catch (error) {
      console.error(colorize(`\n✗ Error: ${error.message}\n`, 'red'));
      process.exit(1);
    }
  });

program
  .command('cost <spec-file>')
  .description('Estimate API costs for running pipeline')
  .option('--detailed', 'Show detailed cost breakdown')
  .action(async (specFile, options) => {
    try {
      const estimate = await estimateCost(specFile, options);

      console.log('\n' + colorize('═'.repeat(60), 'cyan'));
      console.log(colorize('  COST ESTIMATE', 'bright'));
      console.log(colorize('═'.repeat(60), 'cyan') + '\n');

      if (options.detailed) {
        console.log('Phase Breakdown:');
        estimate.phases.forEach(phase => {
          console.log(`  ${phase.name.padEnd(25)} $${phase.cost.toFixed(2)}`);
        });
        console.log();
      }

      console.log(`Total Estimated Cost: ${colorize('$' + estimate.total.toFixed(2), 'bright')}`);
      console.log(`Estimated Time: ${estimate.estimatedTime}`);
      console.log();

    } catch (error) {
      console.error(colorize(`\n✗ Error: ${error.message}\n`, 'red'));
      process.exit(1);
    }
  });

program
  .command('report <spec-file>')
  .description('Generate comprehensive pipeline report')
  .option('--format <type>', 'Report format: text, json, html', 'text')
  .option('--output <file>', 'Output file (default: stdout)')
  .action(async (specFile, options) => {
    try {
      const { generateReport } = require('./pipeline-orchestrator');
      const report = await generateReport(specFile, options);

      if (options.output) {
        fs.writeFileSync(options.output, report);
        console.log(colorize(`\n✓ Report written to ${options.output}\n`, 'green'));
      } else {
        console.log(report);
      }

    } catch (error) {
      console.error(colorize(`\n✗ Error: ${error.message}\n`, 'red'));
      process.exit(1);
    }
  });

program
  .command('config [key] [value]')
  .description('Get or set configuration values')
  .option('--list', 'List all configuration values')
  .option('--reset', 'Reset to default configuration')
  .option('--global', 'Use global config (~/.specmas/config.json)')
  .action(async (key, value, options) => {
    try {
      const manager = new ConfigManager();

      if (options.reset) {
        manager.reset(options.global);
        console.log(colorize('\n✓ Configuration reset to defaults\n', 'green'));
        return;
      }

      if (options.list) {
        const config = manager.getConfig();
        console.log('\n' + colorize('Current Configuration:', 'bright') + '\n');
        console.log(JSON.stringify(config, null, 2));
        console.log();
        return;
      }

      if (!key) {
        console.log('\nUsage:');
        console.log('  specmas config --list              List all config');
        console.log('  specmas config <key>               Get config value');
        console.log('  specmas config <key> <value>       Set config value');
        console.log('  specmas config --reset             Reset to defaults\n');
        return;
      }

      if (!value) {
        // Get value
        const val = manager.get(key);
        console.log(`\n${key} = ${val}\n`);
      } else {
        // Set value
        manager.set(key, value, options.global);
        console.log(colorize(`\n✓ Set ${key} = ${value}\n`, 'green'));
      }

    } catch (error) {
      console.error(colorize(`\n✗ Error: ${error.message}\n`, 'red'));
      process.exit(1);
    }
  });

// ============================================================================
// HELP COMMAND
// ============================================================================

program
  .command('help [command]')
  .description('Display help for command')
  .action((command) => {
    if (command) {
      program.commands.find(cmd => cmd.name() === command)?.help();
    } else {
      console.log('\n' + colorize('═'.repeat(60), 'cyan'));
      console.log(colorize('  SPEC-MAS v' + version, 'bright'));
      console.log(colorize('  Specification-Driven Development Pipeline', 'cyan'));
      console.log(colorize('═'.repeat(60), 'cyan') + '\n');

      console.log(colorize('QUICK START:', 'bright'));
      console.log('  specmas init my-project            Initialize new project');
      console.log('  specmas run spec.md                Run full pipeline');
      console.log('  specmas validate spec.md           Validate spec only\n');

      console.log(colorize('MAIN COMMANDS:', 'bright'));
      console.log('  run <spec-file>                    Run complete pipeline');
      console.log('  validate <spec-file>               Validate spec structure');
      console.log('  review <spec-file>                 Run adversarial reviews');
      console.log('  generate-tests <spec-file>         Generate test scaffolds');
      console.log('  implement <spec-file>              Implement with AI');
      console.log('  integrate [output-dir]             Integrate generated code');
      console.log('  qa <spec-file>                     Run QA validation\n');

      console.log(colorize('UTILITIES:', 'bright'));
      console.log('  init [project-name]                Initialize project');
      console.log('  status <spec-file>                 Show pipeline status');
      console.log('  cost <spec-file>                   Estimate API costs');
      console.log('  report <spec-file>                 Generate report');
      console.log('  config [key] [value]               Manage configuration\n');

      console.log(colorize('OPTIONS:', 'bright'));
      console.log('  -h, --help                         Display help');
      console.log('  -V, --version                      Show version\n');

      console.log(colorize('EXAMPLES:', 'bright'));
      console.log('  # Full pipeline with dry-run');
      console.log('  specmas run specs/my-feature.md --dry-run\n');

      console.log('  # Run with custom budget');
      console.log('  specmas run specs/my-feature.md --budget 100\n');

      console.log('  # Skip certain phases');
      console.log('  specmas run specs/my-feature.md --skip-review --skip-tests\n');

      console.log('  # Resume from checkpoint');
      console.log('  specmas run specs/my-feature.md --resume\n');

      console.log(colorize('DOCUMENTATION:', 'bright'));
      console.log('  docs/cli-reference.md              Complete CLI reference');
      console.log('  STARTUP-QUICK-START.md             Getting started guide');
      console.log('  https://github.com/yourusername/Spec-MAS\n');
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.commands.find(cmd => cmd.name() === 'help')?.action();
}
