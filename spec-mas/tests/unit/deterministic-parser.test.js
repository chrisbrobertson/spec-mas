const { parseDeterministicTestsFromMarkdown } = require('../../src/deterministic-tests/parse-dt');

describe('Deterministic tests parser', () => {
  it('UP-DT-001: extracts DT blocks from markdown', () => {
    const markdown = `
## Deterministic Tests

DT-1
\`\`\`json
{ \"input\": { \"x\": 1 }, \"expected\": { \"x\": 1 } }
\`\`\`

DT-2
\`\`\`json
{ \"input\": { \"y\": 2 }, \"output\": { \"y\": 2 } }
\`\`\`
`;
    const tests = parseDeterministicTestsFromMarkdown(markdown);
    expect(tests).toHaveLength(2);
    expect(tests[0].id).toBe('DT-1');
    expect(tests[0].expected.x).toBe(1);
  });
});
