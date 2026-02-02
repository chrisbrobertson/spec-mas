const fs = require('fs');
const path = require('path');

class FixFailingTestsStep {
  constructor() {
    this.name = 'fix-failing-tests';
    this.outputs = ['fix_request'];
  }

  run(ctx) {
    const failures = ctx.runState?.steps?.['run-tests']?.outputs?.failures || [];
    if (failures.length === 0) {
      return { outputs: { fix_request: null } };
    }

    const artifactDir = path.join(ctx.runDir, 'artifacts');
    fs.mkdirSync(artifactDir, { recursive: true });
    const requestPath = path.join(artifactDir, 'fix-request.json');
    fs.writeFileSync(requestPath, JSON.stringify({ failures }, null, 2));

    throw new Error('Tests failed. Fix request written to artifacts/fix-request.json');
  }
}

module.exports = {
  FixFailingTestsStep
};
