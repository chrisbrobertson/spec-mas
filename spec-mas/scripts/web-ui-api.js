#!/usr/bin/env node

/**
 * Spec-MAS Central Server (dev).
 */

const http = require('http');
const url = require('url');
const {
  listRunStates,
  getRunState,
  upsertRunState,
  getIssues,
  getIssueById,
  setIssueCache,
  getAgents,
  updateAgent
} = require('./web-ui-state');
const { listIssues, getIssue, listIssueComments } = require('./github-issues');

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
  const pathName = parsed.pathname.replace(/^\/api\/ui\//, '/api/');

  if (method === 'GET' && pathName === '/api/runs') {
    return json(res, 200, listRunStates());
  }
  if (method === 'GET' && pathName.startsWith('/api/runs/')) {
    const id = pathName.split('/').pop();
    const run = getRunState(id);
    if (!run) return json(res, 404, { error: 'not found' });
    return json(res, 200, run);
  }
  if (method === 'POST' && pathName === '/api/runs') {
    const body = await parseBody(req);
    try {
      const run = upsertRunState(body);
      return json(res, 200, run);
    } catch (error) {
      return json(res, 400, { error: error.message || 'invalid run' });
    }
  }
  if (method === 'PATCH' && pathName.startsWith('/api/runs/')) {
    const id = pathName.split('/').pop();
    const body = await parseBody(req);
    try {
      const run = upsertRunState({ ...body, id });
      return json(res, 200, run);
    } catch (error) {
      return json(res, 400, { error: error.message || 'invalid run' });
    }
  }
  if (method === 'GET' && pathName === '/api/issues') {
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      const issues = await listIssues({ state: 'open' });
      const includeComments = parsed.query.include === 'latestComment' || process.env.SPECMAS_INCLUDE_COMMENTS === '1';
      const normalized = await Promise.all(issues.map(async issue => {
        let latestComment = null;
        if (includeComments && issue.comments > 0) {
          const comments = await listIssueComments(issue.number, { per_page: 1, sort: 'updated', direction: 'desc' });
          latestComment = comments[0]?.body || null;
        }
        return {
          id: issue.number,
          title: issue.title,
          labels: issue.labels?.map(label => label.name) || [],
          status: issue.state,
          assignee: issue.assignee?.login || null,
          latestComment
        };
      }));
      setIssueCache(normalized);
      return json(res, 200, normalized);
    }
    return json(res, 200, getIssues());
  }
  if (method === 'GET' && pathName.startsWith('/api/issues/')) {
    const id = pathName.split('/').pop();
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      try {
        const issue = await getIssue(id);
        const includeComments = parsed.query.include === 'comments';
        let comments = [];
        if (includeComments) {
          comments = await listIssueComments(id, { per_page: 100 });
        }
        return json(res, 200, {
          id: issue.number,
          title: issue.title,
          labels: issue.labels?.map(label => label.name) || [],
          status: issue.state,
          assignee: issue.assignee?.login || null,
          body: issue.body || '',
          comments
        });
      } catch (error) {
        return json(res, 404, { error: 'not found' });
      }
    }
    const issue = getIssueById(id);
    if (!issue) return json(res, 404, { error: 'not found' });
    return json(res, 200, issue);
  }
  if (method === 'GET' && pathName === '/api/agents') {
    return json(res, 200, getAgents());
  }
  if (method === 'PATCH' && pathName.startsWith('/api/agents/')) {
    const id = pathName.split('/').pop();
    const body = await parseBody(req);
    const updated = updateAgent(id, body);
    return json(res, 200, updated);
  }

  return json(res, 404, { error: 'not found' });
}

function startServer(port = 3333, host = '127.0.0.1') {
  const server = http.createServer(handler);
  server.on('error', (err) => {
    console.error(`Spec-MAS server error: ${err.message}`);
  });
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
