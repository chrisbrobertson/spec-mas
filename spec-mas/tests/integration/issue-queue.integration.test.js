const fs = require('fs');
const os = require('os');
const path = require('path');
const { handleCreate } = require('../../scripts/issue-queue');

const shouldRun = process.env.GITHUB_TOKEN && process.env.GITHUB_REPO;

(shouldRun ? describe : describe.skip)('Issue Queue Integration (GitHub)', () => {
  it('creates issues for a spec', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-issue-'));
    const specPath = path.join(tempDir, 'spec.md');
    fs.writeFileSync(specPath, `---\nspecmas: v3\nkind: FeatureSpec\nid: feat-issue-test\nname: Issue Test\ncomplexity: EASY\nmaturity: 3\n---\n\n# Overview\ntext\n\n# Functional Requirements\n### FR-1: Test\nDo it.\n- **Validation Criteria:**\n  - Given x, When y, Then z\n\n# Acceptance Tests\n### Acceptance Criteria\n- [ ] AT-1: Given x, When y, Then z\n`);
    await handleCreate(specPath);
  }, 300000);
});
