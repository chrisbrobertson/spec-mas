function parseJestFailures(output) {
  if (!output) return [];
  const lines = output.split('\n');
  const failures = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith('● ')) {
      const name = line.slice(2).trim();
      const stack = [];
      for (let j = i + 1; j < lines.length; j += 1) {
        const next = lines[j];
        if (next.trim().startsWith('● ') || next.startsWith('FAIL ')) break;
        if (next.trim().length === 0) {
          if (stack.length > 0) break;
          continue;
        }
        stack.push(next);
        if (stack.length >= 5) break;
      }
      failures.push({ name, stack: stack.join('\n') });
    }
  }

  return failures;
}

module.exports = {
  parseJestFailures
};
