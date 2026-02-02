const fs = require('fs');
const os = require('os');
const path = require('path');
const { findPlaceholderAssertions } = require('../../scripts/check-tests');

describe('Check tests script', () => {
  it('UP-CHECK-001: detects placeholder assertions', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-check-'));
    const testFile = path.join(baseDir, 'sample.test.js');
    fs.writeFileSync(testFile, 'test(\"x\", () => { expect(true).toBe(true); });');

    const matches = findPlaceholderAssertions([baseDir]);
    expect(matches).toHaveLength(1);
  });

  it('UP-CHECK-002: passes when no placeholders', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-check-'));
    const testFile = path.join(baseDir, 'sample.test.js');
    fs.writeFileSync(testFile, 'test(\"x\", () => { expect(1).toBe(1); });');

    const matches = findPlaceholderAssertions([baseDir]);
    expect(matches).toHaveLength(0);
  });
});
