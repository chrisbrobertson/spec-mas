#!/usr/bin/env node

/**
 * Minimal Web UI API server (stubs).
 */

const http = require('http');
const url = require('url');
const {
  listRunStates,
  getIssues,
  getIssueById,
  getAgents,
  updateAgent
} = require('./web-ui-state');

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
  });
}

async function handler(req, res) {
  const parsed = url.parse(req.url, true);
  const method = req.method || 'GET';

  if (method === 'GET' && parsed.pathname === '/api/ui/runs') {
    return json(res, 200, listRunStates());
  }
  if (method === 'GET' && parsed.pathname === '/api/ui/issues') {
    return json(res, 200, getIssues());
  }
  if (method === 'GET' && parsed.pathname.startsWith('/api/ui/issues/')) {
    const id = parsed.pathname.split('/').pop();
    const issue = getIssueById(id);
    if (!issue) return json(res, 404, { error: 'not found' });
    return json(res, 200, issue);
  }
  if (method === 'GET' && parsed.pathname === '/api/ui/agents') {
    return json(res, 200, getAgents());
  }
  if (method === 'PATCH' && parsed.pathname.startsWith('/api/ui/agents/')) {
    const id = parsed.pathname.split('/').pop();
    const body = await parseBody(req);
    const updated = updateAgent(id, body);
    return json(res, 200, updated);
  }

  return json(res, 404, { error: 'not found' });
}

function startServer(port = 3333, host = '127.0.0.1') {
  const server = http.createServer(handler);
  server.listen(port, host, () => {
    console.log(`Spec-MAS Web UI API listening on ${host}:${port}`);
  });
  return server;
}

if (require.main === module) {
  const port = Number(process.env.SPECMAS_UI_PORT || 3333);
  startServer(port);
}

module.exports = { startServer };
