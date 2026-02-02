const path = require('path');
const { ensureUniqueTestName, formatSpecPath } = require('../../scripts/generate-tests');

describe('Generate tests helpers', () => {
  it('UP-GEN-001: ensures unique test names', () => {
    const used = new Map();
    const name1 = ensureUniqueTestName('should do thing', used);
    const name2 = ensureUniqueTestName('should do thing', used);
    const name3 = ensureUniqueTestName('should do thing', used);
    expect(name1).toBe('should do thing');
    expect(name2).toBe('should do thing (2)');
    expect(name3).toBe('should do thing (3)');
  });

  it('UP-GEN-002: formats spec paths without absolute prefixes', () => {
    const absolute = path.join(process.cwd(), 'specs', 'example.md');
    const formatted = formatSpecPath(absolute);
    expect(formatted).toBe(path.join('specs', 'example.md'));
    expect(formatted.includes('/Users/')).toBe(false);
  });
});
