const { parseJestFailures } = require('../../src/test-runner/jest-failure-parser');

describe('Jest failure parser', () => {
  it('UP-JEST-001: extracts failure names and stack snippets', () => {
    const output = `
FAIL  tests/sample.test.js
  ● suite name › should fail

    Expected: 2
    Received: 1
      at Object.<anonymous> (tests/sample.test.js:10:5)
`;
    const failures = parseJestFailures(output);
    expect(failures).toHaveLength(1);
    expect(failures[0].name).toContain('suite name');
    expect(failures[0].stack).toContain('Expected');
  });
});
