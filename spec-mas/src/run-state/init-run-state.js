const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createRunDir } = require('./run-dir');
const { createRunState } = require('./schema');

function hashSpec(specPath) {
  const content = fs.readFileSync(specPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function initRunState(specPath, { runId, baseDir, steps = [], config = {} } = {}) {
  const absoluteSpec = path.resolve(specPath);
  const { runId: finalRunId, path: runDir } = createRunDir({ baseDir, runId });
  const specHash = hashSpec(absoluteSpec);
  const runState = createRunState({
    runId: finalRunId,
    specPath: absoluteSpec,
    specHash,
    steps,
    config
  });

  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(runState, null, 2));
  return { runId: finalRunId, runDir, runState };
}

module.exports = {
  initRunState,
  hashSpec
};
