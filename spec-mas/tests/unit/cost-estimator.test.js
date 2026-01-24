const path = require('path');
const { estimateCost } = require('../../scripts/cost-estimator');

describe('Cost Estimator', () => {
  const fixtures = path.join(__dirname, '..', 'fixtures');

  it('UP-COST-001: estimateCost returns totals for valid spec', async () => {
    const specPath = path.join(fixtures, 'valid-spec.md');
    const result = await estimateCost(specPath, {});
    expect(result.total).toBeGreaterThan(0);
    expect(result.totalApiCalls).toBeGreaterThanOrEqual(0);
    expect(result.phases.length).toBeGreaterThan(0);
  });

  it('UP-COST-002: skip options remove phases', async () => {
    const specPath = path.join(fixtures, 'valid-spec.md');
    const result = await estimateCost(specPath, { skipReview: true });
    const phaseIds = result.phases.map(p => p.id);
    expect(phaseIds).not.toContain('review');
  });

  it('UP-COST-003: CostTracker accumulates costs', () => {
    const { CostTracker } = require('../../scripts/cost-estimator');
    const tracker = new CostTracker(10);
    tracker.recordPhase('validation', 1000000, 1000000);
    tracker.recordPhase('review', 1000000, 0);
    expect(tracker.costs.total).toBeGreaterThan(0);
    expect(tracker.tokens.input).toBeGreaterThan(0);
  });
});
