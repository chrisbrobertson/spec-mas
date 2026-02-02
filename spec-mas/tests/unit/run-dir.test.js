const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRunDir } = require('../../src/run-state/run-dir');

describe('Run directory helper', () => {
  it('UP-RUN-001: creates run directory and returns id/path', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-run-'));
    const { runId, path: runPath } = createRunDir({ baseDir });
    expect(runId).toBeTruthy();
    expect(runPath).toBe(path.join(baseDir, runId));
    expect(fs.existsSync(runPath)).toBe(true);
  });
});
