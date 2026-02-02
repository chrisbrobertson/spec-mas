const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { generateDeterministicTests } = require('../../scripts/generate-deterministic-tests');

describe('Deterministic generation integration', () => {
  it('IP-DT-003: spec -> tests -> pass', async () => {
    const baseDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-dt-int-')));
    const specFile = path.join(baseDir, 'spec.md');

    fs.writeFileSync(specFile, `---\nspecmas: 3.0\nkind: feature\nid: feat-dt-001\nname: DT Example\ncomplexity: HIGH\nmaturity: 5\n---\n\n# Deterministic Tests\n\nDT-1\n\`\`\`json\n{\n  \"input\": { \"value\": 1 },\n  \"expected\": { \"value\": 1 }\n}\n\`\`\`\n`);

    const outputDir = path.join(baseDir, 'tests', 'deterministic');
    const result = await generateDeterministicTests({ specPath: specFile, outputDir, verbose: false });

    expect(result.success).toBe(true);
    const jestBin = path.join(process.cwd(), 'node_modules', 'jest', 'bin', 'jest.js');
    const jestConfig = path.join(baseDir, 'jest.config.js');
    fs.writeFileSync(jestConfig, "module.exports = { rootDir: __dirname, testMatch: ['**/*.test.js'] };");
    const resolvedTestPath = fs.realpathSync(result.filePath);
    execFileSync('node', [jestBin, '--runInBand', '--config', jestConfig, '--runTestsByPath', resolvedTestPath], {
      stdio: 'inherit',
      cwd: baseDir
    });
  });
});
