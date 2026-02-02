/**
 * Spec-MAS Pipeline Orchestrator
 * Core pipeline execution engine that coordinates all phases
 */

const fs = require('fs');
const path = require('path');
const { StepOrchestrator } = require('../src/run-state/step-orchestrator');
const { ValidateSpecStep } = require('../src/steps/validate-spec-step');
const { ScriptStep } = require('../src/steps/script-step');
const { GenerateTestsStep } = require('../src/steps/generate-tests-step');
const { RunTestsStep } = require('../src/steps/run-tests-step');

// Pipeline phase definitions
const PIPELINE_PHASES = [
  {
    id: 'validation',
    name: 'Spec Validation',
    script: 'validate-spec.js',
    required: true,
    estimatedTime: '10s',
    estimatedCost: 0
  },
  {
    id: 'review',
    name: 'Adversarial Review',
    script: 'review-spec.js',
    required: false,
    estimatedTime: '1-2min',
    estimatedCost: 0.50
  },
  {
    id: 'test-generation',
    name: 'Test Generation',
    script: 'generate-tests.js',
    required: true,
    estimatedTime: '30s',
    estimatedCost: 0.25
  },
  {
    id: 'implementation',
    name: 'Code Implementation',
    script: 'implement-spec.js',
    required: true,
    estimatedTime: '2-5min',
    estimatedCost: 5.00
  },
  {
    id: 'integration',
    name: 'Code Integration',
    script: 'code-integration.js',
    required: true,
    estimatedTime: '30s',
    estimatedCost: 0
  },
  {
    id: 'run-tests',
    name: 'Run Tests',
    script: null,
    required: true,
    estimatedTime: '1-2min',
    estimatedCost: 0
  },
  {
    id: 'qa-validation',
    name: 'QA Validation',
    script: 'validate-implementation.js',
    required: true,
    estimatedTime: '1-2min',
    estimatedCost: 0
  }
];

// Color utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function findLatestRunForSpec(specFile, baseDir = path.join(process.cwd(), 'runs')) {
  if (!fs.existsSync(baseDir)) return null;
  const entries = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(baseDir, entry.name, 'run.json'))
    .filter(runFile => fs.existsSync(runFile));

  let latest = null;
  for (const runFile of entries) {
    const runState = JSON.parse(fs.readFileSync(runFile, 'utf8'));
    if (runState.spec_path !== path.resolve(specFile)) continue;
    if (!latest || new Date(runState.created_at) > new Date(latest.created_at)) {
      latest = runState;
    }
  }
  return latest;
}

/**
 * Pipeline Orchestrator Class
 */
class PipelineOrchestrator {
  constructor(specFile, options) {
    this.specFile = path.resolve(specFile);
    this.options = options || {};
    this.startTime = Date.now();
  }

  /**
   * Get phases to run based on options
   */
  getApplicablePhases() {
    return PIPELINE_PHASES.filter(phase => {
      const skipOption = `skip${phase.id.split('-').map(w =>
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join('')}`;

      if (this.options[skipOption]) {
        return false;
      }

      if (phase.id === 'test-generation' && this.options.skipTests) {
        return false;
      }

      if (phase.id === 'qa-validation' && this.options.skipQa) {
        return false;
      }

      if (phase.id === 'run-tests' && this.options.skipRunTests) {
        return false;
      }

      if (!phase.required && this.options.skipReview && phase.id === 'review') {
        return false;
      }

      return true;
    });
  }

  /**
   * Get current pipeline status
   */
  getStatus() {
    const runState = findLatestRunForSpec(this.specFile);
    const phases = this.getApplicablePhases();

    if (!runState) {
      return {
        status: 'not_started',
        currentPhase: null,
        completedPhases: [],
        pendingPhases: phases.map(p => p.id),
        totalPhases: phases.length,
        costs: { total: 0 }
      };
    }

    const completedPhases = Object.entries(runState.steps)
      .filter(([, state]) => state.status === 'completed')
      .map(([name]) => name);

    const pendingPhases = phases
      .map(p => p.id)
      .filter(id => !completedPhases.includes(id));

    const runningPhase = Object.entries(runState.steps)
      .find(([, state]) => state.status === 'running');

    return {
      status: runState.status,
      currentPhase: runningPhase ? runningPhase[0] : null,
      completedPhases,
      pendingPhases,
      totalPhases: phases.length,
      costs: runState.costs || { total: 0 }
    };
  }

  /**
   * Estimate total cost
   */
  estimateTotalCost() {
    return this.getApplicablePhases().reduce((sum, phase) => sum + phase.estimatedCost, 0);
  }

  buildSteps(phases) {
    return phases.map(phase => {
      switch (phase.id) {
        case 'validation':
          return new ValidateSpecStep();
        case 'review':
          return new ScriptStep({
            name: phase.id,
            script: phase.script,
            args: ctx => {
              const args = [ctx.specPath];
              if (ctx.options.parallel) args.push('--parallel');
              return args;
            }
          });
        case 'implementation':
          return new ScriptStep({
            name: phase.id,
            script: phase.script,
            args: ctx => {
              const args = [ctx.specPath];
              if (ctx.options.parallel) args.push('--parallel');
              if (ctx.options.outputDir) args.push('--output-dir', ctx.options.outputDir);
              return args;
            }
          });
        case 'integration':
          return new ScriptStep({
            name: phase.id,
            script: phase.script,
            args: ctx => [ctx.options.outputDir || 'implementation-output']
          });
        case 'run-tests':
          return new RunTestsStep();
        case 'test-generation':
          return new GenerateTestsStep();
        default:
          return new ScriptStep({
            name: phase.id,
            script: phase.script,
            args: ctx => [ctx.specPath]
          });
      }
    });
  }

  /**
   * Run the complete pipeline
   */
  async run() {
    const phases = this.getApplicablePhases();

    // Print header
    this.printPipelineHeader(phases);

    // Show cost estimate
    if (!this.options.yes && !this.options.dryRun) {
      const totalCost = this.estimateTotalCost();
      console.log(colorize('\n─── Cost Estimate ───────────────────────────────────────', 'blue'));
      phases.forEach(phase => {
        console.log(`  ${phase.name.padEnd(25)} $${phase.estimatedCost.toFixed(2)}`);
      });
      console.log(`\n  ${colorize('Total Estimated:', 'bright').padEnd(25)} ${colorize('$' + totalCost.toFixed(2), 'yellow')}`);

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question(colorize('\nContinue? [Y/n]: ', 'bright'), resolve);
      });
      rl.close();

      if (answer.toLowerCase() === 'n') {
        console.log(colorize('\n✗ Pipeline cancelled\n', 'yellow'));
        process.exit(0);
      }
    }

    const totalCost = this.estimateTotalCost();
    const budget = parseFloat(this.options.budget || '0');
    if (budget > 0 && totalCost > budget) {
      console.error(colorize('\n✗ Budget exceeded. Stopping pipeline.', 'red'));
      console.error(`Estimated cost: $${totalCost.toFixed(2)} / Budget: $${budget.toFixed(2)}\n`);
      process.exit(2);
    }

    if (this.options.dryRun) {
      console.log(colorize('\n─── DRY RUN MODE ────────────────────────────────────────', 'yellow'));
      console.log('\nPhases that would be executed:');
      phases.forEach((phase, i) => {
        console.log(`  ${i + 1}. ${phase.name} (${phase.estimatedTime})`);
      });
      console.log(colorize('\nNo actions taken (dry-run mode)\n', 'gray'));
      return;
    }

    console.log(colorize('\n─── Running Pipeline ────────────────────────────────────', 'blue'));

    const steps = this.buildSteps(phases);
    const stepOrchestrator = new StepOrchestrator(this.specFile, steps, {
      runId: this.options.runId,
      resume: this.options.resume,
      fromStep: this.options.fromStep,
      stopAfter: this.options.stopAfter,
      listSteps: this.options.listSteps,
      dryRun: this.options.dryRun,
      maxFixIterations: Number(this.options.maxFixIterations || 0),
      dryRunFix: this.options.dryRunFix,
      estimatedCost: totalCost
    });

    if (this.options.listSteps) {
      const result = await stepOrchestrator.run();
      result.steps.forEach(step => console.log(step));
      return;
    }

    await stepOrchestrator.run();

    this.printCompletionSummary();
  }

  /**
   * Print pipeline header
   */
  printPipelineHeader(phases) {
    const strictMode = process.env.STRICT_MODE === 'true';
    console.log('\n' + colorize('═'.repeat(60), 'cyan'));
    console.log(colorize('  SPEC-MAS PIPELINE v3.0', 'bright'));
    console.log(colorize('═'.repeat(60), 'cyan') + '\n');

    console.log(`Spec: ${colorize(path.basename(this.specFile), 'bright')}`);
    console.log(`Mode: ${this.options.parallel ? 'Parallel' : 'Sequential'}`);
    console.log(`Budget: $${this.options.budget}`);
    console.log(`STRICT_MODE: ${strictMode ? 'true' : 'false'}`);
    console.log(`Phases: ${phases.length}`);
  }

  /**
   * Print completion summary
   */
  printCompletionSummary() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n' + colorize('═'.repeat(60), 'cyan'));
    console.log(colorize('  ✓ PIPELINE COMPLETE', 'green'));
    console.log(colorize('═'.repeat(60), 'cyan') + '\n');

    console.log(`Total Time: ${minutes}m ${seconds}s`);
    console.log(colorize('\n✓ All phases completed successfully!\n', 'green'));
  }
}

/**
 * Run the complete pipeline
 */
async function runPipeline(specFile, options) {
  const orchestrator = new PipelineOrchestrator(specFile, options);
  await orchestrator.run();
}

/**
 * Resume pipeline from checkpoint
 */
async function resumePipeline(specFile, options) {
  if (!options.resume) {
    throw new Error('resume requires a run id');
  }
  const orchestrator = new PipelineOrchestrator(specFile, options);
  await orchestrator.run();
}

/**
 * Generate comprehensive report
 */
async function generateReport(specFile, options) {
  const orchestrator = new PipelineOrchestrator(specFile, options);
  const status = orchestrator.getStatus();

  if (options.format === 'json') {
    return JSON.stringify(status, null, 2);
  }

  let report = '\n' + '═'.repeat(60) + '\n';
  report += '  PIPELINE REPORT\n';
  report += '═'.repeat(60) + '\n\n';

  report += `Spec: ${path.basename(specFile)}\n`;
  report += `Status: ${status.status}\n`;
  report += `Completed: ${status.completedPhases.length}/${status.totalPhases} phases\n`;
  report += `Total Cost: $${status.costs.total.toFixed(2)}\n\n`;

  report += 'Completed Phases:\n';
  status.completedPhases.forEach(phase => {
    report += `  ✓ ${phase}\n`;
  });

  if (status.pendingPhases.length > 0) {
    report += '\nPending Phases:\n';
    status.pendingPhases.forEach(phase => {
      report += `  ○ ${phase}\n`;
    });
  }

  report += '\n';

  return report;
}

module.exports = {
  PipelineOrchestrator,
  runPipeline,
  resumePipeline,
  generateReport,
  PIPELINE_PHASES
};
