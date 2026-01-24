const path = require('path');
const { parseSpec } = require('../../scripts/spec-parser');
const {
  validateG1Structure,
  validateG2Semantic,
  validateG3Traceability,
  validateG4Invariants,
  runAllGates
} = require('../../src/validation/gates');

describe('Validation Gates', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures');

  it('UP-G1-001: missing required front-matter fails', () => {
    const spec = parseSpec(path.join(fixtures, 'missing-front-matter.md'));
    const result = validateG1Structure(spec);
    expect(result.passed).toBe(false);
  });

  it('UP-G1-002: invalid complexity fails', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    spec.metadata.complexity = 'NOPE';
    const result = validateG1Structure(spec);
    expect(result.passed).toBe(false);
  });

  it('UP-G2-002: requires validation criteria for each FR', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    spec.sections.functionalRequirements[0].validationCriteria = [];
    const result = validateG2Semantic(spec);
    expect(result.passed).toBe(false);
  });

  it('UP-G2-003: requires Given/When/Then acceptance criteria', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    spec.sections.acceptanceCriteria = ['AT-1: This is not GWT'];
    const result = validateG2Semantic(spec);
    expect(result.passed).toBe(false);
  });

  it('UP-G3-001: infers FR -> AT mapping by ID', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    const result = validateG3Traceability(spec);
    expect(result.passed).toBe(true);
  });

  it('UP-G3-003: fails when no acceptance criteria exist for FRs', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    spec.sections.acceptanceCriteria = [];
    const result = validateG3Traceability(spec);
    expect(result.passed).toBe(false);
  });

  it('UP-G4-001: requires deterministic tests for HIGH complexity', () => {
    const spec = parseSpec(path.join(fixtures, 'high-no-dt.md'));
    const result = validateG4Invariants(spec);
    expect(result.passed).toBe(false);
  });

  it('UP-G4-002: accepts deterministic tests with expected output', () => {
    const spec = parseSpec(path.join(fixtures, 'high-with-dt.md'));
    const result = validateG4Invariants(spec);
    expect(result.passed).toBe(true);
  });

  it('UP-G4-003: rejects malformed JSON blocks', () => {
    const spec = parseSpec(path.join(fixtures, 'high-with-dt.md'));
    spec.sections.deterministicTests = [];
    spec.sections.deterministic_tests = '```json\n{bad json\n```';
    const result = validateG4Invariants(spec);
    expect(result.passed).toBe(false);
  });

  it('UP-G2-004: requires quantifiable success metrics', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    spec.sections.overview = 'No metrics here';
    spec.raw = '# Overview\nNo metrics here';
    const result = validateG2Semantic(spec);
    expect(result.passed).toBe(false);
  });

  it('UP-G2-005: requires security coverage for MODERATE/HIGH', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    spec.sections.security = 'Authentication only';
    const result = validateG2Semantic(spec);
    expect(result.passed).toBe(false);
  });

  it('runAllGates returns all gates', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    const results = runAllGates(spec);
    expect(results.G1).toBeDefined();
    expect(results.G2).toBeDefined();
    expect(results.G3).toBeDefined();
    expect(results.G4).toBeDefined();
  });
});
