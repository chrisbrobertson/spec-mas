const fs = require('fs');
const os = require('os');
const path = require('path');
const { FixFailingTestsStep } = require('../../src/steps/fix-failing-tests-step');

describe('FixFailingTestsStep', () => {
  it('IP-FIX-001: writes fix request artifact and fails', () => {
    const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-fix-'));
    const runState = {
      steps: {
        'run-tests': {
          outputs: {
            failures: [{ name: 'failed test', stack: 'stack' }]
          }
        }
      }
    };

    const step = new FixFailingTestsStep();
    expect(() => step.run({ runDir, runState })).toThrow();
    const artifactPath = path.join(runDir, 'artifacts', 'fix-request.json');
    expect(fs.existsSync(artifactPath)).toBe(true);
  });
});
