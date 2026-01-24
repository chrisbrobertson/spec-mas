const { analyzeSpec } = require('../../src/architecture/spec-analyzer');

describe('Spec Analyzer', () => {
  it('UP-ANALYZE-001: high-complexity spec triggers split recommendation', () => {
    const frs = Array.from({ length: 15 }).map((_, i) => `## FR-${i + 1}: Do thing`).join('\n');
    const personas = [
      'As a admin, I want ...',
      'As a manager, I want ...',
      'As a analyst, I want ...',
      'As a auditor, I want ...'
    ].join('\n');
    const integrations = [
      '## Integration: Stripe',
      '## Integration: Salesforce',
      '## Integration: Slack'
    ].join('\n');
    const workflows = ['workflow', 'process', 'flow', 'pipeline'].join('\n');
    const raw = [personas, frs, integrations, workflows].join('\n');
    const spec = { raw, metadata: { complexity: 'HIGH', maturity: 4 } };
    const result = analyzeSpec(spec);
    expect(result.shouldSplit).toBe(true);
  });

  it('UP-ANALYZE-002: low-complexity spec does not trigger split', () => {
    const raw = '## FR-1: Do thing\n## FR-2: Do other thing';
    const spec = { raw, metadata: { complexity: 'EASY', maturity: 3 } };
    const result = analyzeSpec(spec);
    expect(result.shouldSplit).toBe(false);
  });
});
