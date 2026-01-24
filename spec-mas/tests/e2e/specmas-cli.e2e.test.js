const path = require('path');
const { spawnSync } = require('child_process');

function runNode(args, options = {}) {
  const result = spawnSync('node', args, {
    encoding: 'utf8',
    ...options
  });
  return result;
}

describe('Spec-MAS CLI E2E', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures');
  const specmas = path.join(__dirname, '..', '..', 'scripts', 'specmas.js');

  it('E2E-CLI-001: specmas validate runs without crash', () => {
    const specPath = path.join(fixtures, 'valid-spec.md');
    const result = runNode([specmas, 'validate', specPath]);
    expect(result.status).toBe(0);
  });

  it('E2E-CLI-002: specmas traceability emits report', () => {
    const specPath = path.join(fixtures, 'valid-spec.md');
    const outputPath = path.join(fixtures, 'trace-e2e.json');
    const result = runNode([specmas, 'traceability', specPath, '--format', 'json', '--output', outputPath]);
    expect(result.status === 0 || result.status === 1).toBe(true);
    const fs = require('fs');
    expect(fs.existsSync(outputPath)).toBe(true);
    fs.unlinkSync(outputPath);
  });
});
