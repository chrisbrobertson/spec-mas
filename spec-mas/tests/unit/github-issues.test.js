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

  it('buildCommentBody formats status comment', () => {
    const body = buildCommentBody({
      agent: 'claude',
      status: 'PASS',
      context: 'Done',
      findings: ['All good'],
      next: ['Close issue'],
      artifacts: ['report.json']
    });
    expect(body).toContain('@agent-claude STATUS: PASS');
    expect(body).toContain('Findings:');
    expect(body).toContain('Artifacts: report.json');
  });
});
