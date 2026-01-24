const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadSpecs, orderSpecs } = require('../../scripts/spec-discovery');

describe('Spec Discovery', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-specs-'));
    fs.writeFileSync(path.join(tempDir, 'system-context.md'), `---\nspecmas: v3\nid: sys-1\nname: System\ncomplexity: EASY\nmaturity: 3\n---\n\n# Overview\ntext`);
    fs.writeFileSync(path.join(tempDir, 'feat-b.md'), `---\nspecmas: v3\nid: feat-b\nname: B\ncomplexity: EASY\nmaturity: 3\ndepends_on: [feat-a]\n---\n\n# Overview\ntext`);
    fs.writeFileSync(path.join(tempDir, 'feat-a.md'), `---\nspecmas: v3\nid: feat-a\nname: A\ncomplexity: EASY\nmaturity: 3\n---\n\n# Overview\ntext`);
  });

  it('loads specs from directory', () => {
    const specs = loadSpecs(tempDir);
    expect(specs.length).toBe(3);
  });

  it('orders specs with system first and dependencies respected', () => {
    const specs = loadSpecs(tempDir);
    const ordered = orderSpecs(specs);
    expect(ordered[0].file).toBe('system-context.md');
    expect(ordered[1].meta.id).toBe('feat-a');
    expect(ordered[2].meta.id).toBe('feat-b');
  });
});
