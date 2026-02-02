const http = require('http');
const { startServer } = require('../../scripts/web-ui-api');

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: 3456, path, method: 'GET' }, (res) => {
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

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body || {});
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3456,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const shouldRun = process.env.SPECMAS_UI_TEST === '1';

(shouldRun ? describe : describe.skip)('Web UI API', () => {
  let server;
  beforeAll(() => { server = startServer(3456, '127.0.0.1'); });
  afterAll(() => { server.close(); });

  it('GET /api/runs returns array', async () => {
    const res = await request('/api/runs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/agents returns array', async () => {
    const res = await request('/api/agents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/runs upserts run state', async () => {
    const res = await post('/api/runs', { id: 'run-test', specId: 'spec-1', status: 'running', phase: 'validate' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('run-test');
  });
});
