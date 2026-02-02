const { assertStepInterface } = require('../../src/steps/step-utils');

describe('Step interface', () => {
  it('UP-STEP-001: accepts valid step contract', () => {
    const step = { name: 'example', run: () => {}, outputs: [] };
    expect(() => assertStepInterface(step)).not.toThrow();
  });

  it('UP-STEP-002: rejects invalid step contract', () => {
    expect(() => assertStepInterface({})).toThrow();
    expect(() => assertStepInterface({ name: 'bad' })).toThrow();
    expect(() => assertStepInterface({ name: 'bad', run: () => {}, outputs: 'nope' })).toThrow();
  });
});
