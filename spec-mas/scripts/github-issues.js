/**
 * GitHub Issues client for Spec-MAS work queue.
 */

const DEFAULT_API = 'https://api.github.com';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getRepo() {
  const repo = process.env.GITHUB_REPO; // owner/name
  if (!repo || !repo.includes('/')) {
    throw new Error('GITHUB_REPO must be set as owner/name');
  }
  return repo;
}

function buildIssuePayload({ title, body, labels, assignees }) {
  return {
    title,
    body,
    labels: labels || [],
    assignees: assignees || []
  };
}

function buildCommentBody({
  agent,
  status,
  context,
  findings,
  next,
  artifacts,
  runId,
  specId,
  issueNumber,
  phase,
  progress,
  completeness,
  summary
}) {
  const lines = [];
  const mention = agent ? `@agent-${agent}` : '@agent';
  lines.push(`${mention} RUN UPDATE`);
  if (runId) lines.push(`Run: ${runId}`);
  if (specId) lines.push(`Spec: ${specId}`);
  if (issueNumber) lines.push(`Issue: ${issueNumber}`);
  if (phase) lines.push(`Phase: ${phase}`);
  if (status) lines.push(`Status: ${status}`);
  if (progress) lines.push(`Progress: ${progress}`);
  if (typeof completeness === 'number') lines.push(`Completeness: ${completeness}%`);
  if (summary || context) lines.push(`Summary: ${summary || context}`);
  if (findings && findings.length > 0) {
    lines.push('Findings:');
    findings.forEach(item => lines.push(`- ${item}`));
  }
  if (next && next.length > 0) {
    lines.push('Next:');
    next.forEach(item => lines.push(`- ${item}`));
  }
  if (artifacts && artifacts.length > 0) {
    lines.push(`Artifacts: ${artifacts.join(', ')}`);
  }
  return lines.join('\n');
}

async function apiRequest(path, options = {}) {
  const token = requireEnv('GITHUB_TOKEN');
  const base = process.env.GITHUB_API_URL || DEFAULT_API;
  const url = `${base}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json();
}

async function createIssue(payload) {
  const repo = getRepo();
  return apiRequest(`/repos/${repo}/issues`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function commentIssue(issueNumber, body) {
  const repo = getRepo();
  return apiRequest(`/repos/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}

async function listIssues(params = {}) {
  const repo = getRepo();
  const search = new URLSearchParams(params).toString();
  const path = `/repos/${repo}/issues${search ? `?${search}` : ''}`;
  return apiRequest(path, { method: 'GET' });
}

async function getIssue(issueNumber) {
  const repo = getRepo();
  return apiRequest(`/repos/${repo}/issues/${issueNumber}`, { method: 'GET' });
}

async function listIssueComments(issueNumber, params = {}) {
  const repo = getRepo();
  const search = new URLSearchParams(params).toString();
  const path = `/repos/${repo}/issues/${issueNumber}/comments${search ? `?${search}` : ''}`;
  return apiRequest(path, { method: 'GET' });
}

module.exports = {
  buildIssuePayload,
  buildCommentBody,
  createIssue,
  commentIssue,
  listIssues,
  getIssue,
  listIssueComments
};
