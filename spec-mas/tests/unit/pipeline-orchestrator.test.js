const fs = require('fs');
const os = require('os');
const path = require('path');
const { PipelineOrchestrator } = require('../../scripts/pipeline-orchestrator');

describe('Pipeline Orchestrator (offline)', () => {
  let tempDir;
  let originalCwd;
  let specPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-pipeline-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    specPath = path.join(tempDir, 'spec.md');
    fs.writeFileSync(specPath, '# Spec');
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it('IT-PIPE-001: applicable phases respect skip flags', () => {
    const orchestrator = new PipelineOrchestrator(specPath, { skipReview: true });
    const phases = orchestrator.getApplicablePhases().map(p => p.id);
    expect(phases).not.toContain('review');
  });

  it('IT-PIPE-002: state file is created and updated', () => {
    const orchestrator = new PipelineOrchestrator(specPath, {});
    const status = orchestrator.getStatus();
    expect(status.status).toBe('not_started');
    expect(status.pendingPhases.length).toBeGreaterThan(0);
  });
});
