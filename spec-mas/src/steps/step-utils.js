function assertStepInterface(step) {
  if (!step || typeof step !== 'object') {
    throw new Error('Step must be an object');
  }
  if (typeof step.name !== 'string' || step.name.trim().length === 0) {
    throw new Error('Step must have a non-empty name');
  }
  if (typeof step.run !== 'function') {
    throw new Error(`Step "${step.name}" must implement run(ctx)`);
  }
  if (step.outputs && !Array.isArray(step.outputs)) {
    throw new Error(`Step "${step.name}" outputs must be an array when provided`);
  }
}

module.exports = {
  assertStepInterface
};
