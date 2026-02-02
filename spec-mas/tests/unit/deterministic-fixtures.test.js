const fs = require('fs');
const os = require('os');
const path = require('path');
const { writeDeterministicFixtures } = require('../../scripts/generate-deterministic-tests');

describe('Deterministic fixtures', () => {
  it('UP-DT-002: writes fixture files with expected output', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-fixtures-'));
    const tests = [
      { id: 'DT-1', input: { a: 1 }, expected: { a: 1 } }
    ];

    const fixturesDir = writeDeterministicFixtures(tests, baseDir);
    const fixtureFile = path.join(fixturesDir, 'DT-1.json');
    expect(fs.existsSync(fixtureFile)).toBe(true);
    const payload = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
    expect(payload.expected.a).toBe(1);
  });
});
