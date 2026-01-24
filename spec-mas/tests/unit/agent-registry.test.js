const fs = require('fs');
const os = require('os');
const path = require('path');
const { detectTools } = require('../../scripts/agent-registry');

describe('Agent Registry', () => {
  let tempDir;
  let originalPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-tools-'));
    originalPath = process.env.PATH;
    process.env.PATH = `${tempDir}:${originalPath}`;
  });

  afterEach(() => {
    process.env.PATH = originalPath;
  });

  it('detectTools returns missing tools when none found', () => {
    const { available, missing } = detectTools(process.env);
    expect(missing.size).toBeGreaterThan(0);
  });

  it('detectTools finds tools on PATH', () => {
    const toolPath = path.join(tempDir, 'claude');
    fs.writeFileSync(toolPath, '#!/bin/sh\necho "claude 1.0.0"\n', { mode: 0o755 });
    const { available } = detectTools(process.env);
    expect(available.has('claude')).toBe(true);
    expect(available.get('claude').version).toContain('claude');
  });
});
