const { withRetry, withFallback } = require('../../src/ai/client');

describe('AI client retry and fallback', () => {
  it('UP-AI-002: retries on transient errors', async () => {
    let attempts = 0;
    const result = await withRetry(() => {
      attempts += 1;
      if (attempts < 3) {
        const error = new Error('transient');
        error.transient = true;
        throw error;
      }
      return 'ok';
    }, { retries: 2, baseDelayMs: 1 });

    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('UP-AI-003: falls back when primary fails', async () => {
    const result = await withFallback(
      async () => {
        throw new Error('primary failed');
      },
      async () => 'fallback'
    );

    expect(result).toBe('fallback');
  });
});
