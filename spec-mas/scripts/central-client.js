/**
 * Spec-MAS Central Server client helpers.
 */

function getServerUrl() {
  return process.env.SPECMAS_SERVER_URL || 'http://127.0.0.1:3333';
}

async function request(path, options = {}) {
  const base = getServerUrl().replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Server error ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function postRunUpdate(payload) {
  return request('/api/runs', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function listRuns() {
  return request('/api/runs', { method: 'GET' });
}

module.exports = {
  getServerUrl,
  postRunUpdate,
  listRuns
};
