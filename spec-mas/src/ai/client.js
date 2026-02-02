const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  provider: 'claude',
  fallback: false,
  models: {
    claude: 'sonnet',
    openai: 'gpt-4'
  },
  routing: {}
};

function loadConfigFile(cwd = process.cwd()) {
  const configPath = path.join(cwd, 'spec-mas.config.json');
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid spec-mas.config.json: ${error.message}`);
  }
}

function getEnvOverrides() {
  const overrides = {};
  if (process.env.AI_PROVIDER) overrides.provider = process.env.AI_PROVIDER;
  if (process.env.AI_FALLBACK_ENABLED) overrides.fallback = process.env.AI_FALLBACK_ENABLED === 'true';
  if (process.env.AI_MODEL_CLAUDE) {
    overrides.models = { ...overrides.models, claude: process.env.AI_MODEL_CLAUDE };
  }
  if (process.env.AI_MODEL_OPENAI) {
    overrides.models = { ...overrides.models, openai: process.env.AI_MODEL_OPENAI };
  }
  return overrides;
}

function mergeConfig(base, update) {
  return {
    ...base,
    ...update,
    models: { ...base.models, ...(update.models || {}) },
    routing: { ...base.routing, ...(update.routing || {}) }
  };
}

function getAIConfig() {
  const fileConfig = loadConfigFile();
  const envOverrides = getEnvOverrides();
  return mergeConfig(mergeConfig(DEFAULT_CONFIG, fileConfig), envOverrides);
}

function resolveStepModel(stepName) {
  const config = getAIConfig();
  const route = config.routing[stepName] || {};
  const provider = route.provider || config.provider;
  const model = route.model || config.models[provider] || config.models.claude;
  return { provider, model, fallback: config.fallback };
}

async function withRetry(fn, { retries = 2, baseDelayMs = 200 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (!error.transient || attempt > retries) {
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function withFallback(primaryFn, fallbackFn) {
  try {
    return await primaryFn();
  } catch (error) {
    return fallbackFn(error);
  }
}

module.exports = {
  getAIConfig,
  resolveStepModel,
  withRetry,
  withFallback,
  loadConfigFile
};
