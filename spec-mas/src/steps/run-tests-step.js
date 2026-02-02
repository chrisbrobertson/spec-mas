const { spawnSync } = require('child_process');
const { parseJestFailures } = require('../test-runner/jest-failure-parser');

class RunTestsStep {
  constructor() {
    this.name = 'run-tests';
    this.outputs = ['test_output', 'failures'];
  }

  run(ctx) {
    const commandParts = ctx.options.testCommand
      ? ctx.options.testCommand.split(' ')
      : ['npm', 'test'];
    const command = commandParts[0];
    const args = commandParts.slice(1);
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      cwd: ctx.options.testCwd || process.cwd()
    });

    const output = `${result.stdout || ''}${result.stderr || ''}`;
    const failures = parseJestFailures(output);

    return {
      success: result.status === 0,
      failures,
      outputs: {
        test_output: output,
        failures
      }
    };
  }
}

module.exports = {
  RunTestsStep
};
