const { buildIssuePayload, buildCommentBody } = require('../../scripts/github-issues');

describe('GitHub Issues Work Queue', () => {
  it('buildIssuePayload constructs payload', () => {
    const payload = buildIssuePayload({
      title: 'Test',
      body: 'Body',
      labels: ['spec:x'],
      assignees: ['user']
    });
    expect(payload.title).toBe('Test');
    expect(payload.labels).toContain('spec:x');
  });

  it('buildCommentBody formats run update comment', () => {
    const body = buildCommentBody({
      agent: 'claude',
      status: 'PASS',
      context: 'Done',
      runId: 'run-1',
      specId: 'spec-1',
      findings: ['All good'],
      next: ['Close issue'],
      artifacts: ['report.json']
    });
    expect(body).toContain('@agent-claude RUN UPDATE');
    expect(body).toContain('Run: run-1');
    expect(body).toContain('Spec: spec-1');
    expect(body).toContain('Status: PASS');
    expect(body).toContain('Findings:');
    expect(body).toContain('Artifacts: report.json');
  });
});
