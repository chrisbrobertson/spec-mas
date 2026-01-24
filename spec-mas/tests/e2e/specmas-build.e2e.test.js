const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const specmasPath = path.join(__dirname, '..', '..', 'scripts', 'specmas.js');
const fixtureSpec = path.join(__dirname, '..', 'fixtures', 'e2e-build-spec.md');

function runNode(args, options = {}) {
  return spawnSync('node', args, { encoding: 'utf8', ...options });
}

describe('Spec-MAS E2E Build', () => {
  const shouldRun = process.env.SPECMAS_E2E_BUILD === '1';
  const provider = process.env.AI_PROVIDER || 'claude';

  const runTest = shouldRun ? it : it.skip;

  runTest('E2E-BUILD-001: builds a project via full pipeline', () => {
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for AI_PROVIDER=openai');
    }
    if (provider === 'claude' && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required for AI_PROVIDER=claude');
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-e2e-build-'));
    const specPath = path.join(tempDir, 'spec.md');
    fs.copyFileSync(fixtureSpec, specPath);

    const outputDir = path.join(tempDir, 'implementation-output');

    const result = runNode([
      specmasPath,
      'run',
      specPath,
      '--yes',
      '--no-git',
      '--budget',
      '5',
      '--output-dir',
      outputDir
    ], {
      cwd: tempDir,
      env: {
        ...process.env,
        AI_PROVIDER: provider
      }
    });

    if (result.status !== 0) {
      const output = `${result.stdout}\n${result.stderr}`;
      throw new Error(`specmas run failed (exit ${result.status}):\n${output}`);
    }

    expect(fs.existsSync(outputDir)).toBe(true);
  }, 300000);
});
