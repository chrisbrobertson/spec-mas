const fs = require('fs');
const path = require('path');

function normalizePath(filePath) {
  if (filePath.startsWith('a/') || filePath.startsWith('b/')) {
    return filePath.slice(2);
  }
  return filePath;
}

function parseHunkHeader(header) {
  const match = header.match(/@@\s*-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s*@@/);
  if (!match) {
    throw new Error(`Invalid hunk header: ${header}`);
  }
  return {
    oldStart: Number(match[1]),
    oldCount: match[2] ? Number(match[2]) : 1,
    newStart: Number(match[3]),
    newCount: match[4] ? Number(match[4]) : 1
  };
}

function applyPatchToFile(filePath, hunks) {
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const fileLines = content.split('\n');
  let output = [];
  let fileIndex = 0;

  hunks.forEach(hunk => {
    const hunkStart = hunk.oldStart - 1;
    output = output.concat(fileLines.slice(fileIndex, hunkStart));
    fileIndex = hunkStart;

    for (const line of hunk.lines) {
      const marker = line[0];
      const text = line.slice(1);

      if (marker === ' ') {
        if (fileLines[fileIndex] !== text) {
          throw new Error(`Patch context mismatch in ${filePath}`);
        }
        output.push(text);
        fileIndex += 1;
      } else if (marker === '-') {
        if (fileLines[fileIndex] !== text) {
          throw new Error(`Patch removal mismatch in ${filePath}`);
        }
        fileIndex += 1;
      } else if (marker === '+') {
        output.push(text);
      }
    }
  });

  output = output.concat(fileLines.slice(fileIndex));
  fs.writeFileSync(filePath, output.join('\n'));
}

function applyPatch(patchText, { rootDir = process.cwd() } = {}) {
  let normalizedPatch = patchText;
  if (!normalizedPatch.includes('\n') && normalizedPatch.includes('\\n')) {
    normalizedPatch = normalizedPatch.replace(/\\n/g, '\n');
  }
  const lines = normalizedPatch.split('\n');
  let i = 0;

  while (i < lines.length) {
    if (!lines[i].startsWith('--- ')) {
      i += 1;
      continue;
    }
    const oldPath = lines[i].slice(4).trim();
    i += 1;
    while (lines[i] === '') {
      i += 1;
    }
    let newPath = null;
    if (!lines[i]) {
      throw new Error('Invalid patch format: missing +++ header');
    }
    if (lines[i].startsWith('+++ ')) {
      newPath = lines[i].slice(4).trim();
      i += 1;
    } else if (lines[i].startsWith('@@')) {
      newPath = oldPath;
    } else {
      throw new Error('Invalid patch format: missing +++ header');
    }

    const filePath = path.join(rootDir, normalizePath(newPath || oldPath));
    const hunks = [];

    while (i < lines.length && lines[i].startsWith('@@')) {
      const header = lines[i];
      const hunk = parseHunkHeader(header);
      i += 1;
      const hunkLines = [];
      while (i < lines.length && !lines[i].startsWith('@@') && !lines[i].startsWith('--- ')) {
        if (lines[i].startsWith('\\ No newline')) {
          i += 1;
          continue;
        }
        hunkLines.push(lines[i]);
        i += 1;
      }
      hunks.push({ ...hunk, lines: hunkLines });
    }

    applyPatchToFile(filePath, hunks);
  }
}

module.exports = {
  applyPatch
};
