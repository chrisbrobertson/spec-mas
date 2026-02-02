const fs = require('fs');
const os = require('os');
const path = require('path');
const { RunTestsStep } = require('../../src/steps/run-tests-step');

describe('RunTestsStep', () => {
  it('IP-TEST-001: runs test command and captures output', () => {
    const baseDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-run-tests-')));
    const testFile = path.join(baseDir, 'sample.test.js');
    fs.writeFileSync(testFile, 'test(\"ok\", () => { expect(1).toBe(1); });');
    const jestConfig = path.join(baseDir, 'jest.config.js');
    fs.writeFileSync(jestConfig, "module.exports = { testMatch: ['**/*.test.js'] };");

    const jestBin = path.join(process.cwd(), 'node_modules', 'jest', 'bin', 'jest.js');
    const command = `node ${jestBin} --runInBand --config ${jestConfig} --runTestsByPath ${testFile}`;
    const step = new RunTestsStep();
    const result = step.run({ options: { testCommand: command, testCwd: baseDir } });

    expect(result.success).toBe(true);
    expect(result.outputs.test_output).toContain('PASS');
  });
});
