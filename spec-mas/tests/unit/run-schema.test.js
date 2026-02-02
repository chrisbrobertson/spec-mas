const { createRunState, validateRunState } = require('../../src/run-state/schema');

describe('Run state schema', () => {
  it('UP-RUN-002: validates minimal run state object', () => {
    const runState = createRunState({
      runId: 'run-123',
      specPath: '/tmp/spec.md',
      specHash: 'abc123',
      steps: ['validation']
    });
    const result = validateRunState(runState);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
