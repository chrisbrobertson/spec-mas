const fs = require('fs');
const os = require('os');
const path = require('path');
const { StepOrchestrator } = require('../../src/run-state/step-orchestrator');
const { ValidateSpecStep } = require('../../src/steps/validate-spec-step');

class TouchStep {
  constructor(name, filename, shouldThrow = false) {
    this.name = name;
    this.filename = filename;
    this.shouldThrow = shouldThrow;
  }

  run(ctx) {
    if (this.shouldThrow) {
      throw new Error('step should not run');
    }
    fs.writeFileSync(path.join(ctx.runDir, this.filename), 'ok');
    return { outputs: { file: this.filename } };
  }
}

describe('Step orchestrator', () => {
  it('IP-STEP-001: runs validation step and records status/checkpoint', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-orch-'));
    const specPath = path.resolve('specs/examples/smoke-feature.md');
    const orchestrator = new StepOrchestrator(specPath, [new ValidateSpecStep()], { runDirBase: baseDir });

    const result = await orchestrator.run();
    const runState = JSON.parse(fs.readFileSync(path.join(result.runDir, 'run.json'), 'utf8'));

    expect(runState.steps.validation.status).toBe('completed');
    expect(fs.existsSync(path.join(result.runDir, 'artifacts', 'validation', 'done.json'))).toBe(true);
  });

  it('IP-STEP-002: resumes and skips completed steps', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-resume-'));
    const specPath = path.resolve('specs/examples/smoke-feature.md');
    const step = new TouchStep('touch', 'touch.txt');
    const first = new StepOrchestrator(specPath, [step], { runDirBase: baseDir });
    const run1 = await first.run();

    const step2 = new TouchStep('touch', 'touch.txt', true);
    const second = new StepOrchestrator(specPath, [step2], { runDirBase: baseDir, resume: run1.runId });
    await expect(second.run()).resolves.toBeTruthy();
  });

  it('IP-STEP-003: starts from specified step and skips earlier steps', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-from-'));
    const specPath = path.resolve('specs/examples/smoke-feature.md');
    const stepA = new TouchStep('step-a', 'a.txt');
    const stepB = new TouchStep('step-b', 'b.txt');
    const orchestrator = new StepOrchestrator(specPath, [stepA, stepB], {
      runDirBase: baseDir,
      fromStep: 'step-b'
    });

    const result = await orchestrator.run();
    const runState = JSON.parse(fs.readFileSync(path.join(result.runDir, 'run.json'), 'utf8'));

    expect(runState.steps['step-a'].status).toBe('skipped');
    expect(fs.existsSync(path.join(result.runDir, 'a.txt'))).toBe(false);
    expect(fs.existsSync(path.join(result.runDir, 'b.txt'))).toBe(true);
  });

  it('IP-STEP-004: stops after specified step', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-stop-'));
    const specPath = path.resolve('specs/examples/smoke-feature.md');
    const stepA = new TouchStep('step-a', 'a.txt');
    const stepB = new TouchStep('step-b', 'b.txt');
    const orchestrator = new StepOrchestrator(specPath, [stepA, stepB], {
      runDirBase: baseDir,
      stopAfter: 'step-a'
    });

    const result = await orchestrator.run();
    const runState = JSON.parse(fs.readFileSync(path.join(result.runDir, 'run.json'), 'utf8'));

    expect(runState.status).toBe('stopped');
    expect(runState.steps['step-a'].status).toBe('completed');
    expect(runState.steps['step-b'].status).toBe('pending');
  });

  it('IP-STEP-005: lists steps without running', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-list-'));
    const specPath = path.resolve('specs/examples/smoke-feature.md');
    const stepA = new TouchStep('step-a', 'a.txt');
    const orchestrator = new StepOrchestrator(specPath, [stepA], {
      runDirBase: baseDir,
      listSteps: true
    });

    const result = await orchestrator.run();
    expect(result.listed).toBe(true);
    expect(result.steps).toEqual(['step-a']);
  });
});
