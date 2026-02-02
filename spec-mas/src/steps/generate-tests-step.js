const path = require('path');
const { execFileSync } = require('child_process');

class GenerateTestsStep {
  constructor() {
    this.name = 'test-generation';
    this.outputs = ['tests_path'];
  }

  run(ctx) {
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'generate-tests.js');
    execFileSync('node', [scriptPath, ctx.specPath], { stdio: 'inherit' });
    return {
      outputs: {
        tests_path: 'tests/generated'
      }
    };
  }
}

module.exports = {
  GenerateTestsStep
};
