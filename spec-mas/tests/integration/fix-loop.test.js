const fs = require('fs');
const os = require('os');
const path = require('path');
const { StepOrchestrator } = require('../../src/run-state/step-orchestrator');

class FailingRunTestsStep {
  constructor(targetFile) {
    this.name = 'run-tests';
    this.targetFile = targetFile;
  }

  run() {
    const content = fs.readFileSync(this.targetFile, 'utf8');
    if (content.includes('good')) {
      return { success: true, outputs: { failures: [] } };
    }
    return {
      success: false,
      failures: [{ name: 'fail', stack: 'stack' }],
      outputs: { failures: [{ name: 'fail', stack: 'stack' }] }
    };
  }
}

describe('Fix loop', () => {
  it('IP-FIX-002: applies patch and reruns tests', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-fix-loop-'));
    const specFile = path.join(baseDir, 'spec.md');
    fs.writeFileSync(specFile, '# Spec');

    const targetFile = path.join(baseDir, 'target.txt');
    fs.writeFileSync(targetFile, 'bad');

    const patchPlan = {
      patches: [
        {
          diff: [
            '--- a/target.txt',
            '+++ b/target.txt',
            '@@ -1,1 +1,1 @@',
            '-bad',
            '+good'
          ].join('\\n')
        }
      ]
    };

    const orchestrator = new StepOrchestrator(specFile, [new FailingRunTestsStep(targetFile)], {
      runDirBase: baseDir,
      maxFixIterations: 1,
      requestPatch: async () => patchPlan,
      patchRootDir: baseDir
    });

    const result = await orchestrator.run();
    expect(fs.readFileSync(targetFile, 'utf8')).toBe('good');
    const attemptDir = path.join(result.runDir, 'artifacts', 'fix-attempt-001');
    expect(fs.existsSync(path.join(attemptDir, 'patch-plan.json'))).toBe(true);
  });

  it('IP-FIX-003: dry-run fix loop does not modify files', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-fix-loop-'));
    const specFile = path.join(baseDir, 'spec.md');
    fs.writeFileSync(specFile, '# Spec');

    const targetFile = path.join(baseDir, 'target.txt');
    fs.writeFileSync(targetFile, 'bad');

    const patchPlan = {
      patches: [
        {
          diff: [
            '--- a/target.txt',
            '+++ b/target.txt',
            '@@ -1,1 +1,1 @@',
            '-bad',
            '+good'
          ].join('\\n')
        }
      ]
    };

    const orchestrator = new StepOrchestrator(specFile, [new FailingRunTestsStep(targetFile)], {
      runDirBase: baseDir,
      maxFixIterations: 1,
      dryRunFix: true,
      requestPatch: async () => patchPlan
    });

    await expect(orchestrator.run()).rejects.toThrow();
    expect(fs.readFileSync(targetFile, 'utf8')).toBe('bad');
  });
});
