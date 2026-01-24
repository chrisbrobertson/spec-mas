/**
 * Web UI state provider for Spec-MAS.
 */

const fs = require('fs');
const path = require('path');
const { TOOL_DEFINITIONS } = require('./agent-registry');

function getStateDir() {
  return path.join(process.cwd(), '.specmas');
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
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
      currentPhase: state.currentPhase,
      completedPhases: state.completedPhases || [],
      updatedAt: state.updatedAt || state.startedAt || null,
      nextStep: state.currentPhase ? `Finish ${state.currentPhase}` : 'Start run'
    };
  });
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

module.exports = {
  listRunStates,
  getIssues,
  getIssueById,
  getAgents,
  updateAgent
};
