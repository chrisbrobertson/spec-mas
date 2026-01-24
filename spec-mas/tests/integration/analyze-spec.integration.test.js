const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

describe('CLI Integration - analyze-spec', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures');
  const analyzeScript = path.join(__dirname, '..', '..', 'scripts', 'analyze-spec.js');

  it('IT-ANALYZE-001: JSON output is written', () => {
    const specPath = path.join(fixtures, 'valid-spec.md');
    const outputPath = path.join(fixtures, 'analysis.json');
    const result = spawnSync('node', [analyzeScript, specPath, '--json', '--output', outputPath], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(fs.existsSync(outputPath)).toBe(true);
    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(report.analysis).toBeDefined();
    fs.unlinkSync(outputPath);
  });
});
