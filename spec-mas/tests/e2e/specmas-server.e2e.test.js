const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');

const shouldRun = process.env.SPECMAS_E2E_SERVER === '1';

function request(pathName, port) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: pathName, method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function waitForServer(port, retries = 20) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await request('/api/runs', port);
      if (res.status === 200) return;
    } catch (_) {
      // retry
    }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('server did not start');
}

(shouldRun ? describe : describe.skip)('Spec-MAS Central Server (E2E)', () => {
  const port = 4567;
  let serverProc;
  let serverLogs = '';
  let stateDir;

  beforeAll(async () => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-server-'));
    const cliPath = path.join(__dirname, '..', '..', 'scripts', 'specmas.js');
    serverProc = spawn('node', [cliPath, 'server', '--port', String(port)], {
      env: { ...process.env, SPECMAS_STATE_DIR: stateDir },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    serverProc.stdout.on('data', chunk => { serverLogs += chunk.toString(); });
    serverProc.stderr.on('data', chunk => { serverLogs += chunk.toString(); });
    await waitForServer(port);
  }, 20000);

  it('accepts run updates via CLI', async () => {
    const cliPath = path.join(__dirname, '..', '..', 'scripts', 'specmas.js');
    const res = spawnSync('node', [
      cliPath,
      'run-update',
      'run-e2e',
      '--spec',
      'spec-e2e',
      '--status',
      'running',
      '--phase',
      'validate'
    ], {
      env: { ...process.env, SPECMAS_SERVER_URL: `http://127.0.0.1:${port}` }
    });
    expect(res.status).toBe(0);

    const runs = await request('/api/runs', port);
    expect(runs.status).toBe(200);
    expect(runs.body.some(run => run.id === 'run-e2e')).toBe(true);
  });

  afterAll(() => {
    if (serverProc && !serverProc.killed) serverProc.kill();
    if (serverLogs && process.env.SPECMAS_E2E_SERVER_LOG === '1') {
      // Optional debugging: print logs when enabled.
      console.log(serverLogs);
    }
  });
});
