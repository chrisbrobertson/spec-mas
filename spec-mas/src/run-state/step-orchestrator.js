const fs = require('fs');
const path = require('path');
const { initRunState } = require('./init-run-state');
const { loadRunState, saveRunState } = require('./run-state-store');
const { appendLogLine } = require('./jsonl-logger');
const { writeCheckpoint } = require('./checkpoint');
const { assertStepInterface } = require('../steps/step-utils');
const { applyPatch } = require('../patching/apply-patch');
const { requestPatch } = require('../patching/request-patch');
const { resolveStepModel } = require('../ai/client');

class StepOrchestrator {
  constructor(specPath, steps, options = {}) {
    this.specPath = path.resolve(specPath);
    this.steps = steps;
    this.options = options;
    this.runDir = null;
    this.runId = null;
    this.runState = null;
  }

  listSteps() {
    return this.steps.map(step => step.name);
  }

  initRun() {
    const stepNames = this.listSteps();
    const { runId, runDir, runState } = initRunState(this.specPath, {
      runId: this.options.runId,
      baseDir: this.options.runDirBase,
      steps: stepNames,
      config: {
        from_step: this.options.fromStep || null,
        stop_after: this.options.stopAfter || null,
        max_fix_iterations: this.options.maxFixIterations || 0,
        estimated_cost_usd: this.options.estimatedCost || 0
      }
    });

    this.runId = runId;
    this.runDir = runDir;
    this.runState = runState;
  }

  loadRun(runId) {
    const baseDir = this.options.runDirBase || path.join(process.cwd(), 'runs');
    const runDir = path.join(baseDir, runId);
    if (!fs.existsSync(runDir)) {
      throw new Error(`Run directory not found: ${runDir}`);
    }
    this.runId = runId;
    this.runDir = runDir;
    this.runState = loadRunState(runDir);
  }

  markSkippedBefore(stepIndex) {
    for (let i = 0; i < stepIndex; i += 1) {
      const stepName = this.steps[i].name;
      const stepState = this.runState.steps[stepName] || {};
      if (stepState.status === 'completed') continue;
      this.runState.steps[stepName] = {
        ...stepState,
        status: 'skipped',
        skipped_at: new Date().toISOString()
      };
    }
  }

  async run() {
    for (const step of this.steps) {
      assertStepInterface(step);
    }

    if (this.options.listSteps) {
      return { listed: true, steps: this.listSteps() };
    }

    if (this.options.resume) {
      this.loadRun(this.options.resume);
    } else {
      this.initRun();
    }

    const fromStep = this.options.fromStep;
    let startIndex = 0;
    if (fromStep) {
      const index = this.steps.findIndex(step => step.name === fromStep);
      if (index === -1) {
        throw new Error(`Unknown step: ${fromStep}`);
      }
      startIndex = index;
      this.markSkippedBefore(index);
    }

    this.runState.status = 'in_progress';
    saveRunState(this.runDir, this.runState);

    for (let i = 0; i < this.steps.length; i += 1) {
      const step = this.steps[i];
      const stepName = step.name;
      const stepState = this.runState.steps[stepName] || { status: 'pending' };

      if (i < startIndex) {
        continue;
      }

      if (this.options.resume && stepState.status === 'completed' && !fromStep) {
        appendLogLine(this.runDir, { level: 'info', step: stepName, message: 'skipped (resume)' });
        continue;
      }

      if (this.options.dryRun) {
        this.runState.steps[stepName] = {
          ...stepState,
          status: 'skipped',
          skipped_at: new Date().toISOString(),
          reason: 'dry-run'
        };
        saveRunState(this.runDir, this.runState);
        continue;
      }

      this.runState.steps[stepName] = {
        ...stepState,
        status: 'running',
        started_at: new Date().toISOString(),
        ...resolveStepModel(stepName)
      };
      saveRunState(this.runDir, this.runState);
      appendLogLine(this.runDir, { level: 'info', step: stepName, message: 'started' });

      try {
        let result = await step.run({
          specPath: this.specPath,
          runId: this.runId,
          runDir: this.runDir,
          runState: this.runState,
          options: this.options
        });

        if (result && result.success === false) {
          if (this.options.maxFixIterations > 0 && step.name === 'run-tests') {
            result = await this.runFixLoop(step, result);
            if (result && result.success === false) {
              throw new Error('Tests still failing after fix loop');
            }
          } else {
            throw new Error('Tests failed. Enable fix loop to attempt patches.');
          }
        }

        this.runState.steps[stepName] = {
          ...this.runState.steps[stepName],
          status: 'completed',
          completed_at: new Date().toISOString(),
          outputs: result?.outputs || null
        };
        saveRunState(this.runDir, this.runState);
        writeCheckpoint(this.runDir, stepName, { outputs: result?.outputs || null });
        appendLogLine(this.runDir, { level: 'info', step: stepName, message: 'completed' });

        if (this.options.stopAfter && stepName === this.options.stopAfter) {
          this.runState.status = 'stopped';
          saveRunState(this.runDir, this.runState);
          return { stopped: true, step: stepName, runId: this.runId, runDir: this.runDir };
        }
      } catch (error) {
        this.runState.steps[stepName] = {
          ...this.runState.steps[stepName],
          status: 'failed',
          failed_at: new Date().toISOString(),
          error: error.message
        };
        this.runState.status = 'failed';
        saveRunState(this.runDir, this.runState);
        appendLogLine(this.runDir, { level: 'error', step: stepName, message: error.message });
        throw error;
      }
    }

    this.runState.status = 'completed';
    this.runState.completed_at = new Date().toISOString();
    saveRunState(this.runDir, this.runState);
    return { completed: true, runId: this.runId, runDir: this.runDir };
  }

  async runFixLoop(step, result) {
    const maxIterations = Number(this.options.maxFixIterations || 0);
    let iteration = this.runState.fix_iterations || 0;

    while (result.success === false && iteration < maxIterations) {
      iteration += 1;
      this.runState.fix_iterations = iteration;
      saveRunState(this.runDir, this.runState);

      const patchRequester = this.options.requestPatch || requestPatch;
      const patchPlan = await patchRequester({
        failures: result.failures || [],
        files: result.files || []
      });

      const attemptId = String(iteration).padStart(3, '0');
      const attemptDir = path.join(this.runDir, 'artifacts', `fix-attempt-${attemptId}`);
      fs.mkdirSync(attemptDir, { recursive: true });
      fs.writeFileSync(path.join(attemptDir, 'patch-plan.json'), JSON.stringify(patchPlan, null, 2));

      if (this.options.dryRunFix) {
        fs.writeFileSync(path.join(attemptDir, 'dry-run.txt'), 'dry-run fix loop');
        return { ...result, success: false };
      }

      if (patchPlan && Array.isArray(patchPlan.patches)) {
        patchPlan.patches.forEach(patch => {
          if (!patch.diff) {
            throw new Error('Patch plan missing diff text');
          }
          applyPatch(patch.diff, { rootDir: this.options.patchRootDir || process.cwd() });
        });
      }

      result = await step.run({
        specPath: this.specPath,
        runId: this.runId,
        runDir: this.runDir,
        runState: this.runState,
        options: this.options
      });
    }

    if (result.success === false) {
      throw new Error(`Tests still failing after ${iteration} fix attempts`);
    }

    return result;
  }
}

module.exports = {
  StepOrchestrator
};
