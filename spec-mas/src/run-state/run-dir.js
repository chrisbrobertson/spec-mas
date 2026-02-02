const fs = require('fs');
const path = require('path');

function generateRunId(now = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${date}-${time}-${rand}`;
}

function createRunDir({ baseDir = path.join(process.cwd(), 'runs'), runId } = {}) {
  const finalRunId = runId || generateRunId();
  const runPath = path.join(baseDir, finalRunId);
  fs.mkdirSync(runPath, { recursive: true });
  return { runId: finalRunId, path: runPath };
}

module.exports = {
  createRunDir,
  generateRunId
};
