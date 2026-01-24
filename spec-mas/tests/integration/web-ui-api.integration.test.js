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

const shouldRun = process.env.SPECMAS_UI_TEST === '1';

(shouldRun ? describe : describe.skip)('Web UI API', () => {
  let server;
  beforeAll(() => { server = startServer(3456, '127.0.0.1'); });
  afterAll(() => { server.close(); });

  it('GET /api/ui/runs returns array', async () => {
    const res = await request('/api/ui/runs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/ui/agents returns array', async () => {
    const res = await request('/api/ui/agents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
