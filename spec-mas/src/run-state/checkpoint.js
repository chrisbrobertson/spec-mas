const fs = require('fs');
const path = require('path');

function writeCheckpoint(runDir, stepName, data = {}) {
  const artifactsDir = path.join(runDir, 'artifacts', stepName);
  fs.mkdirSync(artifactsDir, { recursive: true });
  const payload = {
    step: stepName,
    completed_at: new Date().toISOString(),
    ...data
  };
  fs.writeFileSync(path.join(artifactsDir, 'done.json'), JSON.stringify(payload, null, 2));
}

module.exports = {
  writeCheckpoint
};
