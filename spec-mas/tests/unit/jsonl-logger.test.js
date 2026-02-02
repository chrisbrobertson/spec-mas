const fs = require('fs');
const os = require('os');
const path = require('path');
const { appendLogLine, readLogLines } = require('../../src/run-state/jsonl-logger');

describe('JSONL logger', () => {
  it('UP-LOG-001: appends and reads log lines', () => {
    const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-log-'));
    appendLogLine(runDir, { level: 'info', message: 'first' });
    appendLogLine(runDir, { level: 'info', message: 'second' });

    const lines = readLogLines(runDir);
    expect(lines).toHaveLength(2);
    expect(lines[0].message).toBe('first');
    expect(lines[1].message).toBe('second');
  });
});
