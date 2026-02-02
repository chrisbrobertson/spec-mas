const RUN_SCHEMA_VERSION = 1;

function createRunState({ runId, specPath, specHash, steps = [], config = {} }) {
  const stepMap = {};
  for (const step of steps) {
    stepMap[step] = {
      status: 'pending'
    };
  }

  return {
    version: RUN_SCHEMA_VERSION,
    run_id: runId,
    created_at: new Date().toISOString(),
    spec_path: specPath,
    spec_hash: specHash,
    status: 'initialized',
    steps: stepMap,
    config,
    fix_iterations: 0,
    max_fix_iterations: config.max_fix_iterations || 0,
    estimated_cost_usd: config.estimated_cost_usd || 0
  };
}

function validateRunState(state) {
  const errors = [];
  if (!state || typeof state !== 'object') {
    return { valid: false, errors: ['Run state must be an object'] };
  }

  const required = ['version', 'run_id', 'created_at', 'spec_path', 'spec_hash', 'status', 'steps'];
  for (const key of required) {
    if (!(key in state)) {
      errors.push(`Missing required key: ${key}`);
    }
  }

  if (state.version !== RUN_SCHEMA_VERSION) {
    errors.push(`Unsupported schema version: ${state.version}`);
  }

  if (typeof state.steps !== 'object' || Array.isArray(state.steps)) {
    errors.push('Steps must be an object map');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  RUN_SCHEMA_VERSION,
  createRunState,
  validateRunState
};
