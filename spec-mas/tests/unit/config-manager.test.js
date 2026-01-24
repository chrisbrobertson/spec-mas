const fs = require('fs');
const os = require('os');
const path = require('path');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-config-'));
}

describe('Config Manager', () => {
  let tempDir;
  let originalCwd;
  let originalHome;

  beforeEach(() => {
    tempDir = makeTempDir();
    originalCwd = process.cwd();
    originalHome = process.env.HOME;
    process.chdir(tempDir);
    process.env.HOME = tempDir;
    jest.resetModules();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env.HOME = originalHome;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_MODEL;
    delete process.env.SPECMAS_BUDGET;
  });

  it('UP-CONFIG-001: loads defaults when no config files exist', () => {
    const { ConfigManager } = require('../../scripts/config-manager');
    const manager = new ConfigManager();
    const config = manager.getConfig();
    expect(config.api.model).toBeDefined();
    expect(config.costs.budget_limit).toBeGreaterThan(0);
  });

  it('UP-CONFIG-002: applies environment overrides', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.ANTHROPIC_MODEL = 'test-model';
    process.env.SPECMAS_BUDGET = '99';
    const { ConfigManager } = require('../../scripts/config-manager');
    const manager = new ConfigManager();
    const config = manager.getConfig();
    expect(config.api.anthropic_key).toBe('test-key');
    expect(config.api.model).toBe('test-model');
    expect(config.costs.budget_limit).toBe(99);
  });

  it('UP-CONFIG-003: set() writes project config file', () => {
    const { ConfigManager } = require('../../scripts/config-manager');
    const manager = new ConfigManager();
    manager.set('api.model', 'custom-model');
    const configPath = path.join(tempDir, '.specmas', 'config.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(saved.api.model).toBe('custom-model');
  });

  it('UP-CONFIG-004: reset() removes config file', () => {
    const { ConfigManager } = require('../../scripts/config-manager');
    const manager = new ConfigManager();
    manager.set('api.model', 'custom-model');
    manager.reset();
    const configPath = path.join(tempDir, '.specmas', 'config.json');
    expect(fs.existsSync(configPath)).toBe(false);
  });
});
