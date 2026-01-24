const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');

function runNode(args, options = {}) {
  const result = spawnSync('node', args, {
    encoding: 'utf8',
    ...options
  });
  return result;
}

describe('CLI Integration - validate-spec', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures');
  const validateScript = path.join(__dirname, '..', '..', 'scripts', 'validate-spec.js');

  it('IT-CLI-001: valid spec exits 0 and reports PASS', () => {
    const specPath = path.join(fixtures, 'valid-spec.md');
    const result = runNode([validateScript, specPath, '--summary']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('PASS');
  });

  it('IT-CLI-002: invalid spec exits non-zero', () => {
    const specPath = path.join(fixtures, 'missing-front-matter.md');
    const result = runNode([validateScript, specPath, '--summary']);
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('FAIL');
  });

  it('IT-CLI-003: JSON report contains metadata and gates', () => {
    const specPath = path.join(fixtures, 'valid-spec.md');
    const outputPath = path.join(fixtures, 'report.json');
    const result = runNode([validateScript, specPath, '--json', '--output', outputPath]);
    expect(result.status).toBe(0);
    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(report.metadata.name).toBe('Validation Fixture');
    expect(report.gates).toBeDefined();
    fs.unlinkSync(outputPath);
  });
});

describe('CLI Integration - traceability matrix', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures');
  const traceScript = path.join(__dirname, '..', '..', 'scripts', 'traceability-matrix.js');

  it('IT-TRACE-003: supports JSON output format', () => {
    const specPath = path.join(fixtures, 'valid-spec.md');
    const outputPath = path.join(fixtures, 'trace.json');
    const result = runNode([traceScript, specPath, '--format', 'json', '--output', outputPath]);
    expect(fs.existsSync(outputPath)).toBe(true);
    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(report.traceability).toBeDefined();
    fs.unlinkSync(outputPath);
  });
});
