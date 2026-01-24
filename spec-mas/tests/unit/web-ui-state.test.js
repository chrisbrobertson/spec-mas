const fs = require('fs');
const os = require('os');
const path = require('path');

describe('Web UI State', () => {
  let tempDir;
  let originalCwd;
  let state;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-ui-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    state = require('../../scripts/web-ui-state');
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it('returns empty runs when no state files exist', () => {
    expect(state.listRunStates()).toEqual([]);
  });

  it('updates agent config', () => {
    const updated = state.updateAgent('claude', { enabled: false });
    expect(updated.enabled).toBe(false);
    const agents = state.getAgents();
    expect(agents.find(a => a.id === 'claude').enabled).toBe(false);
  });
});
