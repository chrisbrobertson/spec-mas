const path = require('path');
const { parseSpec } = require('../../scripts/spec-parser');
const { runAllGates } = require('../../src/validation/gates');

describe('Deterministic Tests', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures');

  it('DT-001: Parse front-matter and sections', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    expect(spec.metadata.name).toBe('Validation Fixture');
    expect(spec.sections.overview).toBeDefined();
  });

  it('DT-002: G3 inferred traceability passes for FR-1 -> AT-1', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    const results = runAllGates(spec);
    expect(results.G3.passed).toBe(true);
  });
});
