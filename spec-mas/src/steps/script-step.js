const path = require('path');
const { execFileSync } = require('child_process');

class ScriptStep {
  constructor({ name, script, args = [] }) {
    this.name = name;
    this.script = script;
    this.args = args;
  }

  run(ctx) {
    const scriptPath = path.isAbsolute(this.script)
      ? this.script
      : path.join(__dirname, '..', '..', 'scripts', this.script);

    const args = typeof this.args === 'function'
      ? this.args(ctx)
      : this.args;

    execFileSync('node', [scriptPath, ...args], { stdio: 'inherit' });
    return { outputs: null };
  }
}

module.exports = {
  ScriptStep
};
