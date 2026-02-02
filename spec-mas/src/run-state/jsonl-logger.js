const fs = require('fs');
const path = require('path');

function appendLogLine(runDir, entry) {
  const filePath = path.join(runDir, 'logs.jsonl');
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
  fs.appendFileSync(filePath, `${line}\n`);
}

function readLogLines(runDir) {
  const filePath = path.join(runDir, 'logs.jsonl');
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

module.exports = {
  appendLogLine,
  readLogLines
};
