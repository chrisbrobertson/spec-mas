const fs = require('fs');
const os = require('os');
const path = require('path');
const { resolveStepModel, loadConfigFile } = require('../../src/ai/client');

describe('AI client config', () => {
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
  });

  it('UP-AI-001: loads config file and merges env overrides', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-ai-'));
    const configPath = path.join(baseDir, 'spec-mas.config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      provider: 'openai',
      models: { openai: 'gpt-file' },
      routing: { review: { provider: 'claude', model: 'sonnet-file' } }
    }, null, 2));

    process.chdir(baseDir);
    process.env.AI_PROVIDER = 'claude';
    process.env.AI_MODEL_OPENAI = 'gpt-env';

    const config = loadConfigFile();
    expect(config.provider).toBe('openai');

    const resolved = resolveStepModel('default');
    expect(resolved.provider).toBe('claude');
  });
});
