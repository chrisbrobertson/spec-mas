const fs = require('fs');
const path = require('path');

function loadRunState(runDir) {
  const filePath = path.join(runDir, 'run.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`run.json not found in ${runDir}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveRunState(runDir, runState) {
  const filePath = path.join(runDir, 'run.json');
  fs.writeFileSync(filePath, JSON.stringify(runState, null, 2));
}

module.exports = {
  loadRunState,
  saveRunState
};
