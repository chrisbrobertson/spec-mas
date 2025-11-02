/**
 * Spec-MAS Progress Tracker
 * Real-time progress visualization for pipeline execution
 */

const readline = require('readline');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

/**
 * Progress Tracker Class
 */
class ProgressTracker {
  constructor(totalPhases) {
    this.totalPhases = totalPhases;
    this.currentPhase = -1;
    this.phases = new Array(totalPhases).fill(null).map(() => ({
      name: '',
      status: 'pending', // pending, in_progress, completed, failed
      progress: 0,
      startTime: null,
      endTime: null
    }));
    this.startTime = null;
  }

  /**
   * Start tracking
   */
  start() {
    this.startTime = Date.now();
  }

  /**
   * Start a new phase
   */
  startPhase(phaseIndex, phaseName) {
    this.currentPhase = phaseIndex;
    this.phases[phaseIndex].name = phaseName;
    this.phases[phaseIndex].status = 'in_progress';
    this.phases[phaseIndex].progress = 0;
    this.phases[phaseIndex].startTime = Date.now();
  }

  /**
   * Update phase progress
   */
  updatePhase(phaseIndex, progress, message = '') {
    if (phaseIndex >= 0 && phaseIndex < this.totalPhases) {
      this.phases[phaseIndex].progress = Math.min(100, Math.max(0, progress));
      this.phases[phaseIndex].message = message;
    }
  }

  /**
   * Complete a phase
   */
  completePhase(phaseIndex) {
    if (phaseIndex >= 0 && phaseIndex < this.totalPhases) {
      this.phases[phaseIndex].status = 'completed';
      this.phases[phaseIndex].progress = 100;
      this.phases[phaseIndex].endTime = Date.now();
    }
  }

  /**
   * Fail a phase
   */
  failPhase(phaseIndex, error) {
    if (phaseIndex >= 0 && phaseIndex < this.totalPhases) {
      this.phases[phaseIndex].status = 'failed';
      this.phases[phaseIndex].error = error;
      this.phases[phaseIndex].endTime = Date.now();
    }
  }

  /**
   * Get phase status indicator
   */
  getStatusIndicator(phase) {
    switch (phase.status) {
      case 'completed':
        return colorize('✓', 'green');
      case 'in_progress':
        return colorize('→', 'yellow');
      case 'failed':
        return colorize('✗', 'red');
      default:
        return colorize('○', 'gray');
    }
  }

  /**
   * Create progress bar
   */
  createProgressBar(progress, width = 20) {
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    const bar = '#'.repeat(filled) + '-'.repeat(empty);

    let color = 'blue';
    if (progress === 100) color = 'green';
    else if (progress < 30) color = 'red';
    else if (progress < 70) color = 'yellow';

    return `[${colorize(bar, color)}] ${progress.toString().padStart(3)}%`;
  }

  /**
   * Render current progress
   */
  render() {
    console.log('\n' + colorize('Running Pipeline', 'bright'));
    console.log(colorize('═'.repeat(60), 'cyan') + '\n');

    this.phases.forEach((phase, index) => {
      if (phase.name) {
        const indicator = this.getStatusIndicator(phase);
        const progressBar = this.createProgressBar(phase.progress);
        const phaseNum = `Phase ${index + 1}:`;

        console.log(`${indicator} ${phaseNum.padEnd(9)} ${phase.name.padEnd(25)} ${progressBar}`);

        if (phase.message) {
          console.log(`  ${colorize(phase.message, 'dim')}`);
        }
      }
    });

    // Overall progress
    const completedPhases = this.phases.filter(p => p.status === 'completed').length;
    const overallProgress = Math.round((completedPhases / this.totalPhases) * 100);

    console.log();
    console.log(colorize('─'.repeat(60), 'gray'));
    console.log(`Progress: ${completedPhases}/${this.totalPhases} phases complete (${overallProgress}%)`);

    // Time info
    if (this.startTime) {
      const elapsed = Math.round((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      console.log(`Elapsed: ${minutes}m ${seconds}s`);
    }

    console.log();
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const completed = this.phases.filter(p => p.status === 'completed').length;
    const failed = this.phases.filter(p => p.status === 'failed').length;
    const inProgress = this.phases.filter(p => p.status === 'in_progress').length;
    const pending = this.phases.filter(p => p.status === 'pending').length;

    const totalTime = this.phases
      .filter(p => p.endTime && p.startTime)
      .reduce((sum, p) => sum + (p.endTime - p.startTime), 0);

    return {
      total: this.totalPhases,
      completed,
      failed,
      inProgress,
      pending,
      totalTimeMs: totalTime,
      overallProgress: Math.round((completed / this.totalPhases) * 100)
    };
  }

  /**
   * Print final summary
   */
  printSummary(costs = { total: 0 }, budget = 50) {
    const summary = this.getSummary();
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    console.log('\n' + colorize('═'.repeat(60), 'cyan'));
    if (summary.failed > 0) {
      console.log(colorize('  ✗ PIPELINE FAILED', 'red'));
    } else {
      console.log(colorize('  ✓ PIPELINE COMPLETE', 'green'));
    }
    console.log(colorize('═'.repeat(60), 'cyan') + '\n');

    console.log(`Phases Completed: ${summary.completed}/${summary.total}`);
    if (summary.failed > 0) {
      console.log(colorize(`Failed Phases: ${summary.failed}`, 'red'));
    }

    console.log(`Total Time: ${minutes}m ${seconds}s`);
    console.log(`Total Cost: $${costs.total.toFixed(2)} / $${budget}`);

    // Failed phases details
    if (summary.failed > 0) {
      console.log(colorize('\nFailed Phases:', 'red'));
      this.phases
        .filter(p => p.status === 'failed')
        .forEach(p => {
          console.log(`  ✗ ${p.name}`);
          if (p.error) {
            console.log(`    ${colorize(p.error, 'dim')}`);
          }
        });
    }

    console.log();
  }
}

/**
 * Simple spinner for indeterminate progress
 */
class Spinner {
  constructor(message = 'Loading...') {
    this.message = message;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.frameIndex = 0;
    this.intervalId = null;
  }

  start() {
    process.stdout.write('\x1B[?25l'); // Hide cursor

    this.intervalId = setInterval(() => {
      const frame = this.frames[this.frameIndex];
      process.stdout.write(`\r${colorize(frame, 'cyan')} ${this.message}`);
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    }, 80);
  }

  stop(finalMessage = null) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    process.stdout.write('\r\x1B[K'); // Clear line

    if (finalMessage) {
      console.log(finalMessage);
    }

    process.stdout.write('\x1B[?25h'); // Show cursor
  }

  succeed(message) {
    this.stop(colorize('✓', 'green') + ' ' + message);
  }

  fail(message) {
    this.stop(colorize('✗', 'red') + ' ' + message);
  }

  warn(message) {
    this.stop(colorize('⚠', 'yellow') + ' ' + message);
  }
}

/**
 * Create a progress bar string
 */
function createProgressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percentage}%`;
}

/**
 * Format elapsed time
 */
function formatElapsedTime(startTime) {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Estimate remaining time
 */
function estimateRemainingTime(startTime, completed, total) {
  const elapsed = Date.now() - startTime;
  const rate = elapsed / completed;
  const remaining = rate * (total - completed);
  const seconds = Math.round(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

module.exports = {
  ProgressTracker,
  Spinner,
  createProgressBar,
  formatElapsedTime,
  estimateRemainingTime,
  colorize
};
