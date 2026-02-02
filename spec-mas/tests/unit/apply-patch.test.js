const fs = require('fs');
const os = require('os');
const path = require('path');
const { applyPatch } = require('../../src/patching/apply-patch');

describe('Apply patch utility', () => {
  it('UP-PATCH-001: applies unified diff successfully', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-patch-'));
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'line1\nline2\nline3');

    const patch = [
      '--- a/file.txt',
      '+++ b/file.txt',
      '@@ -1,3 +1,3 @@',
      ' line1',
      '-line2',
      '+line2b',
      ' line3'
    ].join('\n');

    applyPatch(patch, { rootDir: baseDir });
    const updated = fs.readFileSync(filePath, 'utf8');
    expect(updated).toBe('line1\nline2b\nline3');
  });

  it('UP-PATCH-002: rejects mismatched patch context', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-patch-'));
    const filePath = path.join(baseDir, 'file.txt');
    fs.writeFileSync(filePath, 'line1\nline2\nline3');

    const patch = [
      '--- a/file.txt',
      '+++ b/file.txt',
      '@@ -1,3 +1,3 @@',
      ' line1',
      '-lineX',
      '+line2b',
      ' line3'
    ].join('\n');

    expect(() => applyPatch(patch, { rootDir: baseDir })).toThrow();
    const updated = fs.readFileSync(filePath, 'utf8');
    expect(updated).toBe('line1\nline2\nline3');
  });
});
