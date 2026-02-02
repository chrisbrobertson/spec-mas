/**
 * Web UI state provider for Spec-MAS.
 */

const fs = require('fs');
const path = require('path');
const { TOOL_DEFINITIONS } = require('./agent-registry');

function getStateDir() {
  return process.env.SPECMAS_STATE_DIR
    || process.env.SPECMAS_SERVER_STATE_DIR
    || path.join(process.cwd(), '.specmas');
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function safeId(value) {
  return String(value || '').replace(/[^\w.-]+/g, '-');
}

function listRunStates() {
  const stateDir = getStateDir();
  if (!fs.existsSync(stateDir)) return [];
  const files = fs.readdirSync(stateDir).filter(f => f.endsWith('-state.json'));
  return files.map(file => {
    const state = readJson(path.join(stateDir, file), {});
    return {
      id: file.replace('-state.json', ''),
      specFile: state.specFile,
      status: state.status,
      currentPhase: state.currentPhase || state.phase || null,
      completedPhases: state.completedPhases || [],
      updatedAt: state.updatedAt || state.startedAt || null,
      nextStep: state.currentPhase
        ? `Finish ${state.currentPhase}`
        : state.phase
          ? `Finish ${state.phase}`
          : 'Start run'
    };
  });
}

function getRunState(id) {
  const stateDir = getStateDir();
  const file = path.join(stateDir, `${safeId(id)}-state.json`);
  if (!fs.existsSync(file)) return null;
  return readJson(file, null);
}

function upsertRunState(run) {
  const stateDir = getStateDir();
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
  const runId = run.id || run.runId || run.specId || run.specFile;
  if (!runId) {
    throw new Error('run id required');
  }
  const file = path.join(stateDir, `${safeId(runId)}-state.json`);
  const existing = readJson(file, {});
  const now = new Date().toISOString();
  const next = {
    ...existing,
    ...run,
    id: safeId(runId),
    updatedAt: now,
    startedAt: existing.startedAt || run.startedAt || now
  };
  writeJson(file, next);
  return next;
}

function readIssueCache() {
  const stateDir = getStateDir();
  return readJson(path.join(stateDir, 'issues.json'), []);
}

function getIssues() {
  return readIssueCache();
}

function getIssueById(id) {
  const issues = readIssueCache();
  return issues.find(issue => String(issue.id) === String(id)) || null;
}

function getAgents() {
  const stateDir = getStateDir();
  const configured = readJson(path.join(stateDir, 'agents.json'), null);
  if (configured) return configured;
  return TOOL_DEFINITIONS.map(tool => ({
    id: tool.name,
    provider: tool.name,
    model: null,
    enabled: true
  }));
}

function updateAgent(agentId, updates) {
  const stateDir = getStateDir();
  const agentsPath = path.join(stateDir, 'agents.json');
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
  const agents = getAgents();
  const next = agents.map(agent => {
    if (agent.id !== agentId) return agent;
    return { ...agent, ...updates };
  });
  fs.writeFileSync(agentsPath, JSON.stringify(next, null, 2));
  return next.find(agent => agent.id === agentId);
}

function setIssueCache(issues) {
  const stateDir = getStateDir();
  const issuesPath = path.join(stateDir, 'issues.json');
  writeJson(issuesPath, issues || []);
  return issues || [];
}

module.exports = {
  listRunStates,
  getRunState,
  upsertRunState,
  getIssues,
  getIssueById,
  setIssueCache,
  getAgents,
  updateAgent
};
