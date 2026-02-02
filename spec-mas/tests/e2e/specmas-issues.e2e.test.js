const path = require('path');
const { spawnSync } = require('child_process');

const shouldRun = process.env.SPECMAS_E2E_ISSUES === '1'
  && process.env.GITHUB_TOKEN
  && process.env.GITHUB_REPO
  && process.env.SPECMAS_E2E_ISSUE;

(shouldRun ? describe : describe.skip)('Spec-MAS Issues CLI (E2E)', () => {
  it('posts a comment update to GitHub', () => {
    const cliPath = path.join(__dirname, '..', '..', 'scripts', 'specmas.js');
    const res = spawnSync('node', [
      cliPath,
      'issues',
      'comment',
      process.env.SPECMAS_E2E_ISSUE,
      'RUNNING'
    ], {
      env: { ...process.env }
    });
    expect(res.status).toBe(0);
  });
});
