/**
 * Spec-MAS Agent Registry (patterned after ai-coord)
 * Defines tool metadata and detects availability on PATH.
 */

const { spawnSync } = require('child_process');

const TOOL_DEFINITIONS = [
  {
    name: 'claude',
    command: 'claude',
    versionArgs: ['--version'],
    roles: ['lead', 'validator']
  },
  {
    name: 'codex',
    command: 'codex',
    versionArgs: ['--version'],
    roles: ['lead', 'validator']
  },
  {
    name: 'gemini',
    command: 'gemini',
    versionArgs: ['--version'],
    roles: ['lead', 'validator']
  },
  {
    name: 'deepseek',
    command: 'deepseek',
    versionArgs: ['--version'],
    roles: ['lead', 'validator']
  }
];

function resolveOnPath(command, env = process.env) {
  const result = spawnSync('which', [command], { encoding: 'utf8', env });
  if (result.status !== 0) return null;
  return (result.stdout || '').trim() || null;
}

function getVersion(command, versionArgs, env = process.env) {
  const result = spawnSync(command, versionArgs, { encoding: 'utf8', env });
  if (result.status !== 0) return null;
  return (result.stdout || '').trim() || null;
}

function detectTools(env = process.env) {
  const available = new Map();
  const missing = new Set();

  for (const tool of TOOL_DEFINITIONS) {
    const resolved = resolveOnPath(tool.command, env);
    if (!resolved) {
      missing.add(tool.name);
      continue;
    }
    const version = getVersion(tool.command, tool.versionArgs, env);
    available.set(tool.name, {
      name: tool.name,
      command: tool.command,
      path: resolved,
      version: version || 'unknown',
      roles: tool.roles
    });
  }

  return { available, missing };
}

module.exports = {
  TOOL_DEFINITIONS,
  detectTools
};
