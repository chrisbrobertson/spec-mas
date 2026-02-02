const path = require('path');
const { execFileSync } = require('child_process');

class ValidateSpecStep {
  constructor() {
    this.name = 'validation';
    this.outputs = ['validation_report'];
  }

  run(ctx) {
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'validate-spec.js');
    execFileSync('node', [scriptPath, ctx.specPath], { stdio: 'inherit' });
    return {
      outputs: {
        validation_report: 'stdout'
      }
    };
  }
}

module.exports = {
  ValidateSpecStep
};
