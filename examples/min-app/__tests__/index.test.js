const { add } = require('../src/index');

describe('min-app', () => {
  it('adds numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
