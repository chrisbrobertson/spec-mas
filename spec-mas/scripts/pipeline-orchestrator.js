/**
 * Spec-MAS Pipeline Orchestrator
 * Core pipeline execution engine that coordinates all phases
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { ProgressTracker } = require('./progress-tracker');
const { ConfigManager } = require('./config-manager');

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

/**
 * Pipeline Orchestrator Class
 */
class PipelineOrchestrator {
  constructor(specFile, options) {
    this.specFile = path.resolve(specFile);
    this.options = options;
    this.stateFile = this.getStateFilePath();
    this.state = this.loadState();
    this.tracker = new ProgressTracker(PIPELINE_PHASES.length);
    this.startTime = Date.now();
  }

  /**
   * Get state file path for this spec
   */
  getStateFilePath() {
    const specDir = path.dirname(this.specFile);
    const specName = path.basename(this.specFile, '.md');
    const stateDir = path.join(process.cwd(), '.specmas');

    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    return path.join(stateDir, `${specName}-state.json`);
  }

  /**
   * Load pipeline state from disk
   */
  loadState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      } catch (error) {
        console.warn(colorize('⚠ Warning: Could not load state file, starting fresh', 'yellow'));
      }
    }

    return {
      specFile: this.specFile,
      startedAt: new Date().toISOString(),
      status: 'not_started',
      currentPhase: null,
      completedPhases: [],
      costs: {
        total: 0
      },
      outputs: {
        tests: null,
        code: null,
        reports: {}
      }
    };
  }

  /**
   * Save pipeline state to disk
   */
  saveState() {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error(colorize('⚠ Warning: Could not save state file', 'yellow'));
    }
  }

  /**
   * Get current pipeline status
   */
  getStatus() {
    const totalPhases = this.getApplicablePhases().length;
    const completedCount = this.state.completedPhases.length;
    const pendingPhases = this.getApplicablePhases()
      .filter(p => !this.state.completedPhases.includes(p.id))
      .map(p => p.name);

    return {
      status: this.state.status,
      currentPhase: this.state.currentPhase,
      completedPhases: this.state.completedPhases,
      pendingPhases: pendingPhases,
      totalPhases: totalPhases,
      costs: this.state.costs
    };
  }

  /**
   * Get phases to run based on options
   */
  getApplicablePhases() {
    return PIPELINE_PHASES.filter(phase => {
      // Check if phase is skipped
      const skipOption = `skip${phase.id.split('-').map(w =>
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join('')}`;

      if (this.options[skipOption]) {
        return false;
      }

      // Check if phase is required
      if (!phase.required && this.options.skipReview && phase.id === 'review') {
        return false;
      }

      return true;
    });
  }

  /**
   * Estimate total cost
   */
  estimateTotalCost() {
    return this.getApplicablePhases().reduce((sum, phase) => sum + phase.estimatedCost, 0);
  }

  /**
   * Run a single phase
   */
  async runPhase(phase, phaseIndex) {
    console.log(colorize(`\n[${phaseIndex + 1}/${this.getApplicablePhases().length}] ${phase.name}...`, 'bright'));

    this.state.currentPhase = phase.id;
    this.state.status = 'in_progress';
    this.saveState();

    try {
      // Update progress tracker
      this.tracker.startPhase(phaseIndex, phase.name);

      // Build command
      const scriptPath = path.join(__dirname, phase.script);
      let args = [this.specFile];

      // Add phase-specific options
      if (phase.id === 'review' && this.options.parallel) {
        args.push('--parallel');
      }
      if (phase.id === 'implementation') {
        if (this.options.parallel) args.push('--parallel');
        if (this.options.outputDir) args.push('--output-dir', this.options.outputDir);
      }
      if (phase.id === 'integration') {
        args = [this.options.outputDir || 'implementation-output'];
      }

      // Execute phase script
      const result = this.executePhase(scriptPath, args);

      // Mark phase complete
      this.state.completedPhases.push(phase.id);
      this.tracker.completePhase(phaseIndex);

      // Save checkpoint
      this.saveState();

      return result;

    } catch (error) {
      this.state.status = 'failed';
      this.state.error = error.message;
      this.saveState();

      console.error(colorize(`\n✗ Phase failed: ${error.message}`, 'red'));
      throw error;
    }
  }

  /**
   * Execute a phase script
   */
  executePhase(scriptPath, args) {
    try {
      const output = execSync(`node ${scriptPath} ${args.join(' ')}`, {
        stdio: 'inherit',
        encoding: 'utf8'
      });
      return { success: true, output };
    } catch (error) {
      throw new Error(`Phase execution failed: ${error.message}`);
    }
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

      // Ask for confirmation
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

    // Dry run mode
    if (this.options.dryRun) {
      console.log(colorize('\n─── DRY RUN MODE ────────────────────────────────────────', 'yellow'));
      console.log('\nPhases that would be executed:');
      phases.forEach((phase, i) => {
        console.log(`  ${i + 1}. ${phase.name} (${phase.estimatedTime})`);
      });
      console.log(colorize('\nNo actions taken (dry-run mode)\n', 'gray'));
      return;
    }

    // Run phases
    console.log(colorize('\n─── Running Pipeline ────────────────────────────────────', 'blue'));
    this.tracker.start();

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];

      // Check budget
      if (this.state.costs.total > parseFloat(this.options.budget)) {
        console.error(colorize('\n✗ Budget exceeded! Stopping pipeline.', 'red'));
        console.log(`Total cost: $${this.state.costs.total.toFixed(2)} / $${this.options.budget}\n`);
        process.exit(1);
      }

      await this.runPhase(phase, i);
    }

    // Pipeline complete
    this.state.status = 'completed';
    this.state.completedAt = new Date().toISOString();
    this.saveState();

    this.printCompletionSummary();
  }

  /**
   * Print pipeline header
   */
  printPipelineHeader(phases) {
    console.log('\n' + colorize('═'.repeat(60), 'cyan'));
    console.log(colorize('  SPEC-MAS PIPELINE v3.0', 'bright'));
    console.log(colorize('═'.repeat(60), 'cyan') + '\n');

    console.log(`Spec: ${colorize(path.basename(this.specFile), 'bright')}`);
    console.log(`Mode: ${this.options.parallel ? 'Parallel' : 'Sequential'}`);
    console.log(`Budget: $${this.options.budget}`);
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
    console.log(`Total Cost: $${this.state.costs.total.toFixed(2)} / $${this.options.budget}`);
    console.log(`Phases Completed: ${this.state.completedPhases.length}/${this.getApplicablePhases().length}`);

    // Show generated outputs
    if (this.state.outputs.tests) {
      console.log(`\nGenerated Tests: ${this.state.outputs.tests}`);
    }
    if (this.state.outputs.code) {
      console.log(`Generated Code: ${this.state.outputs.code}`);
    }

    // Show reports
    const reports = Object.values(this.state.outputs.reports).filter(Boolean);
    if (reports.length > 0) {
      console.log('\nReports:');
      reports.forEach(report => {
        console.log(`  - ${report}`);
      });
    }

    console.log(colorize('\n✓ All phases completed successfully!\n', 'green'));
    console.log('Next Steps:');
    console.log('  1. Review generated code');
    console.log('  2. Run: npm test');
    console.log('  3. Run: git diff');
    console.log('  4. Deploy when ready!\n');
  }
}

/**
 * Run the complete pipeline
 */
async function runPipeline(specFile, options, config) {
  const orchestrator = new PipelineOrchestrator(specFile, options);
  await orchestrator.run();
}

/**
 * Resume pipeline from checkpoint
 */
async function resumePipeline(specFile, options) {
  const orchestrator = new PipelineOrchestrator(specFile, options);

  if (orchestrator.state.status === 'completed') {
    console.log(colorize('\n✓ Pipeline already completed for this spec.\n', 'green'));
    console.log('Use --force to run again.\n');
    return;
  }

  if (orchestrator.state.status === 'not_started') {
    console.log(colorize('\nNo checkpoint found. Running full pipeline...\n', 'yellow'));
    await orchestrator.run();
    return;
  }

  console.log(colorize('\n✓ Resuming from checkpoint...\n', 'green'));
  console.log(`Completed phases: ${orchestrator.state.completedPhases.join(', ')}`);
  console.log(`Resuming from: ${orchestrator.state.currentPhase}\n`);

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

  // Text format
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
