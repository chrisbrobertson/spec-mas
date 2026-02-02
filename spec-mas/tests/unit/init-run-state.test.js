const fs = require('fs');
const os = require('os');
const path = require('path');
const { initRunState, hashSpec } = require('../../src/run-state/init-run-state');

describe('Run state initialization', () => {
  it('UP-RUN-003: writes run.json with required keys', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-runstate-'));
    const specFile = path.join(baseDir, 'spec.md');
    fs.writeFileSync(specFile, '# Spec\n\n## Overview\ncontent');

    const { runDir } = initRunState(specFile, { baseDir, steps: ['validation'] });
    const runState = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));

    expect(runState.run_id).toBeTruthy();
    expect(runState.spec_path).toBe(path.resolve(specFile));
    expect(runState.spec_hash).toBeTruthy();
    expect(runState.steps.validation.status).toBe('pending');
  });

  it('UP-RUN-004: stable hash for same spec, different for changes', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-hash-'));
    const specFile = path.join(baseDir, 'spec.md');
    fs.writeFileSync(specFile, 'alpha');
    const hash1 = hashSpec(specFile);
    const hash2 = hashSpec(specFile);
    expect(hash1).toBe(hash2);

    fs.writeFileSync(specFile, 'beta');
    const hash3 = hashSpec(specFile);
    expect(hash3).not.toBe(hash1);
  });
});
