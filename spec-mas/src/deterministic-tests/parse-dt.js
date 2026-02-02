function parseDeterministicTestsFromMarkdown(markdown) {
  if (!markdown) return [];
  const tests = [];
  const pattern = /DT-([0-9]+)[\s\S]*?```json\s*([\s\S]*?)```/gi;
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    const id = `DT-${match[1]}`;
    try {
      const payload = JSON.parse(match[2]);
      tests.push({ id, ...payload });
    } catch (error) {
      // Skip invalid JSON block
    }
  }
  return tests;
}

module.exports = {
  parseDeterministicTestsFromMarkdown
};
