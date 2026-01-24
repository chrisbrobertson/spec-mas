const path = require('path');
const { parseSpec } = require('../../scripts/spec-parser');
const {
  extractRequirements,
  mapTests,
  generateJSONReport
} = require('../../scripts/traceability-matrix');

const fs = require('fs');

describe('Traceability Matrix', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures');

  it('UP-TRACE-001: extracts FR/US/AC requirements', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    const requirements = extractRequirements(spec);
    expect(requirements.some(r => r.id.startsWith('FR-'))).toBe(true);
    expect(requirements.some(r => r.id.startsWith('AC-'))).toBe(true);
  });

  it('UP-TRACE-002: maps tests by ID when present', () => {
    const spec = parseSpec(path.join(fixtures, 'valid-spec.md'));
    const requirements = extractRequirements(spec);
    const mapping = requirements.map(req => ({ requirement: req, implementations: [], tests: [], status: 'NOT_IMPLEMENTED' }));
    const testFile = path.join(fixtures, 'fake-test.test.js');
    fs.writeFileSync(testFile, 'describe("x", () => { it("FR-1", () => {}); });');
    mapTests(mapping, [testFile], false);
    const hasTest = mapping.some(m => m.tests.length > 0);
    fs.unlinkSync(testFile);
    expect(hasTest).toBe(true);
  });

  it('UP-TRACE-003: JSON report format includes traceability', () => {
    const report = generateJSONReport([], { traceabilityPercent: 0, total: 0, fullyTraced: 0, complete: 0, partial: 0, notImplemented: 0 }, 'Spec');
    const parsed = JSON.parse(report);
    expect(parsed.traceability).toBeDefined();
  });
});
