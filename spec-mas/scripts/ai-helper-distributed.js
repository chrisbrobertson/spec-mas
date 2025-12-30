/**
 * Spec-MAS Distributed AI Helper v2.0
 * 
 * Routes AI requests between multiple backends:
 * - Mac Studio (Ollama - fast local code generation)
 * - DGX Spark (Ollama - heavy compute, larger models)
 * - Claude API (fallback / complex reasoning)
 * 
 * Features:
 * - Automatic health checking and failover
 * - Task-based routing (code gen, review, etc.)
 * - Cost tracking for cloud API calls
 * - Configurable routing strategies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Node health status cache
const nodeHealth = new Map();
const HEALTH_CACHE_TTL = 30000; // 30 seconds

/**
 * Load network configuration
 */
function loadConfig() {
  // Try loading from config file first
  const configPaths = [
    path.join(process.cwd(), '.specmas', 'network-config.json'),
    path.join(process.cwd(), 'spec-mas', '.specmas', 'network-config.json')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        console.warn(`Warning: Could not parse ${configPath}`);
      }
    }
  }

  // Fall back to environment-based config
  return getDefaultConfig();
}

/**
 * Get default configuration from environment variables
 */
function getDefaultConfig() {
  return {
    nodes: {
      'mac-studio': {
        name: 'Mac Studio',
        host: process.env.MAC_STUDIO_HOST || '192.168.1.50',
        port: parseInt(process.env.MAC_STUDIO_PORT || '11434'),
        type: 'ollama',
        enabled: process.env.MAC_STUDIO_ENABLED !== 'false',
        models: {
          default: 'qwen2.5-coder:32b',
          code: 'specmas-coder',
          fast: 'qwen2.5-coder:7b'
        },
        capabilities: ['code-generation', 'code-review', 'test-generation'],
        priority: 1
      },
      'dgx-spark': {
        name: 'DGX Spark',
        host: process.env.DGX_SPARK_HOST || '192.168.1.100',
        port: parseInt(process.env.DGX_SPARK_PORT || '11434'),
        type: 'ollama',
        enabled: process.env.DGX_SPARK_ENABLED !== 'false',
        models: {
          default: 'qwen2.5:72b',
          heavy: 'specmas-heavy',
          batch: 'specmas-batch',
          code: 'qwen2.5-coder:32b'
        },
        capabilities: ['code-generation', 'architecture-review', 'complex-reasoning', 'batch-processing', 'security-review'],
        priority: 2
      },
      'claude-api': {
        name: 'Claude API',
        type: 'anthropic',
        enabled: process.env.CLAUDE_ENABLED !== 'false',
        fallbackOnly: process.env.CLAUDE_FALLBACK_ONLY === 'true',
        models: {
          default: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
          complex: 'claude-sonnet-4-20250514'
        },
        capabilities: ['code-generation', 'code-review', 'architecture-review', 'complex-reasoning'],
        priority: 99
      }
    },
    routing: {
      'code-generation': ['mac-studio', 'dgx-spark', 'claude-api'],
      'code-review': ['mac-studio', 'claude-api'],
      'test-generation': ['mac-studio', 'dgx-spark'],
      'architecture-review': ['dgx-spark', 'claude-api'],
      'complex-reasoning': ['dgx-spark', 'claude-api'],
      'batch-processing': ['dgx-spark'],
      'security-review': ['dgx-spark', 'claude-api'],
      'default': ['mac-studio', 'dgx-spark', 'claude-api']
    }
  };
}

/**
 * Check if an Ollama node is healthy
 */
async function checkOllamaHealth(node) {
  const cacheKey = `${node.host}:${node.port}`;
  const cached = nodeHealth.get(cacheKey);
  
  // Use cache if still valid
  if (cached && Date.now() - cached.timestamp < HEALTH_CACHE_TTL) {
    return cached.healthy;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `http://${node.host}:${node.port}/api/tags`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const healthy = response.ok;
    nodeHealth.set(cacheKey, { healthy, timestamp: Date.now() });
    return healthy;
  } catch (error) {
    nodeHealth.set(cacheKey, { healthy: false, timestamp: Date.now() });
    return false;
  }
}

/**
 * Call Ollama API (Mac Studio or DGX Spark)
 */
async function callOllama(node, systemPrompt, userPrompt, options = {}) {
  const model = options.model || node.models?.default || node.models?.code || 'qwen2.5-coder:32b';
  const url = `http://${node.host}:${node.port}/api/generate`;
  
  // Format prompt for Qwen models
  let prompt = userPrompt;
  if (systemPrompt && systemPrompt.trim()) {
    prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userPrompt}<|im_end|>\n<|im_start|>assistant\n`;
  }

  const requestOptions = {
    temperature: options.temperature ?? 0.2,
    top_p: options.top_p ?? 0.9,
    num_ctx: options.num_ctx ?? 16384,
    num_predict: options.maxTokens ?? 4096
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: requestOptions
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Ollama error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  return {
    content: data.response?.trim() || '',
    tokens: {
      input: data.prompt_eval_count || 0,
      output: data.eval_count || 0
    },
    provider: node.name || 'ollama',
    model,
    node: `${node.host}:${node.port}`,
    timing: {
      totalMs: data.total_duration ? data.total_duration / 1000000 : null,
      promptMs: data.prompt_eval_duration ? data.prompt_eval_duration / 1000000 : null,
      evalMs: data.eval_duration ? data.eval_duration / 1000000 : null
    }
  };
}

/**
 * Call Claude API
 */
async function callClaude(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable not set.\n' +
      'Add it to your .env file or export ANTHROPIC_API_KEY=your-key'
    );
  }

  const model = options.model || process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
  const maxTokens = options.maxTokens || 8192;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt || undefined,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Claude API error (${response.status}): ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  
  return {
    content: data.content[0]?.text || '',
    tokens: {
      input: data.usage?.input_tokens || 0,
      output: data.usage?.output_tokens || 0
    },
    provider: 'claude-api',
    model: data.model,
    node: 'api.anthropic.com'
  };
}

/**
 * Call Claude CLI (legacy support)
 */
async function callClaudeCLI(systemPrompt, userPrompt, options = {}) {
  const os = require('os');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-'));
  
  try {
    // Combine prompts
    let combinedPrompt = userPrompt;
    if (systemPrompt && systemPrompt.trim()) {
      combinedPrompt = `<SYSTEM_INSTRUCTIONS>\n${systemPrompt}\n</SYSTEM_INSTRUCTIONS>\n\n<USER_PROMPT>\n${userPrompt}\n</USER_PROMPT>`;
    }

    const { spawnSync } = require('child_process');
    const modelFlag = options.model ? ['--model', options.model] : [];
    
    const result = spawnSync('npx', ['claude', '--print', ...modelFlag], {
      input: combinedPrompt,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Claude CLI exited with code ${result.status}`);
    }

    return {
      content: result.stdout.trim(),
      tokens: { input: 0, output: 0 },
      provider: 'claude-cli',
      model: options.model || 'sonnet'
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Select best node for task
 */
async function selectNode(taskType, config) {
  const routing = config.routing || {};
  const preferLocal = process.env.PREFER_LOCAL !== 'false';
  
  // Get nodes in order for this task type
  let nodeOrder = routing[taskType] || routing['default'] || ['mac-studio', 'dgx-spark', 'claude-api'];
  
  // If not preferring local, put Claude first
  if (!preferLocal) {
    nodeOrder = ['claude-api', ...nodeOrder.filter(n => n !== 'claude-api')];
  }

  const triedNodes = [];
  
  for (const nodeId of nodeOrder) {
    const node = config.nodes[nodeId];
    if (!node || !node.enabled) {
      continue;
    }

    // Skip fallback-only nodes on first pass
    if (node.fallbackOnly && triedNodes.length === 0) {
      continue;
    }

    triedNodes.push(nodeId);

    // Check health for Ollama nodes
    if (node.type === 'ollama') {
      const healthy = await checkOllamaHealth(node);
      if (healthy) {
        return { nodeId, node };
      }
      console.warn(colors.yellow + `[Router] Node ${nodeId} unhealthy, trying next...` + colors.reset);
    } else if (node.type === 'anthropic') {
      // Claude is available if API key is set
      if (process.env.ANTHROPIC_API_KEY) {
        return { nodeId, node };
      }
    }
  }

  // Second pass: try fallback nodes
  for (const nodeId of nodeOrder) {
    const node = config.nodes[nodeId];
    if (!node || !node.enabled || !node.fallbackOnly) continue;
    if (triedNodes.includes(nodeId)) continue;

    if (node.type === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      return { nodeId, node };
    }
  }

  throw new Error('No healthy nodes available for task: ' + taskType);
}

/**
 * Main AI call interface with automatic routing
 */
async function callAI(systemPrompt, userPrompt, options = {}) {
  const config = loadConfig();
  const taskType = options.taskType || 'code-generation';
  const maxRetries = parseInt(process.env.MAX_LOCAL_RETRIES || '2');
  
  let lastError = null;
  let attempts = 0;
  const triedNodes = new Set();

  while (attempts <= maxRetries) {
    try {
      // Mark previously tried nodes as unhealthy temporarily
      for (const nodeId of triedNodes) {
        const node = config.nodes[nodeId];
        if (node?.type === 'ollama') {
          nodeHealth.set(`${node.host}:${node.port}`, { healthy: false, timestamp: Date.now() });
        }
      }

      const { nodeId, node } = await selectNode(taskType, config);
      
      // Skip if we already tried this node
      if (triedNodes.has(nodeId)) {
        attempts++;
        continue;
      }
      triedNodes.add(nodeId);

      console.log(colors.cyan + `[Router] ${taskType} → ${nodeId}` + colors.reset);

      let result;
      if (node.type === 'ollama') {
        result = await callOllama(node, systemPrompt, userPrompt, options);
      } else if (node.type === 'anthropic') {
        result = await callClaude(systemPrompt, userPrompt, options);
      } else {
        throw new Error(`Unknown node type: ${node.type}`);
      }

      console.log(colors.green + `[Router] Success via ${nodeId} (${result.tokens.output} tokens)` + colors.reset);
      return result;

    } catch (error) {
      lastError = error;
      console.warn(colors.yellow + `[Router] Attempt ${attempts + 1} failed: ${error.message}` + colors.reset);
      attempts++;
    }
  }

  throw lastError || new Error('All nodes failed for task: ' + taskType);
}

/**
 * Force call to specific node
 */
async function callNode(nodeId, systemPrompt, userPrompt, options = {}) {
  const config = loadConfig();
  const node = config.nodes[nodeId];
  
  if (!node) {
    throw new Error(`Unknown node: ${nodeId}`);
  }

  if (!node.enabled) {
    throw new Error(`Node ${nodeId} is disabled`);
  }

  if (node.type === 'ollama') {
    return await callOllama(node, systemPrompt, userPrompt, options);
  } else if (node.type === 'anthropic') {
    return await callClaude(systemPrompt, userPrompt, options);
  }
  
  throw new Error(`Unsupported node type: ${node.type}`);
}

/**
 * Get status of all nodes
 */
async function getNodeStatus() {
  const config = loadConfig();
  const status = {};

  for (const [nodeId, node] of Object.entries(config.nodes)) {
    if (!node.enabled) {
      status[nodeId] = {
        name: node.name || nodeId,
        type: node.type,
        enabled: false,
        healthy: false,
        reason: 'disabled'
      };
      continue;
    }

    if (node.type === 'ollama') {
      const healthy = await checkOllamaHealth(node);
      status[nodeId] = {
        name: node.name || nodeId,
        type: node.type,
        enabled: true,
        healthy,
        host: `${node.host}:${node.port}`,
        models: node.models
      };
    } else if (node.type === 'anthropic') {
      const hasKey = !!process.env.ANTHROPIC_API_KEY;
      status[nodeId] = {
        name: node.name || nodeId,
        type: node.type,
        enabled: true,
        healthy: hasKey,
        host: 'api.anthropic.com',
        reason: hasKey ? null : 'ANTHROPIC_API_KEY not set'
      };
    }
  }

  return status;
}

/**
 * Calculate cost for API calls
 */
function calculateCost(inputTokens, outputTokens, provider = 'claude', model = null) {
  // Local nodes are free
  if (provider !== 'claude-api' && provider !== 'anthropic') {
    return 0;
  }

  // Claude pricing (per 1M tokens)
  const pricing = {
    'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    'default': { input: 3.00, output: 15.00 }
  };

  const modelPricing = pricing[model] || pricing.default;
  const inputCost = (inputTokens / 1000000) * modelPricing.input;
  const outputCost = (outputTokens / 1000000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * Test provider availability
 */
async function testProvider(provider = 'mac-studio') {
  try {
    const result = await callNode(provider, '', 'Reply with just the word "OK"', { maxTokens: 10 });
    return {
      success: true,
      provider: result.provider,
      model: result.model,
      node: result.node,
      message: 'Provider is available'
    };
  } catch (error) {
    return {
      success: false,
      provider,
      error: error.message,
      message: `Provider test failed: ${error.message}`
    };
  }
}

/**
 * Get current AI configuration
 */
function getAIConfig() {
  const config = loadConfig();
  return {
    provider: 'distributed',
    nodes: Object.keys(config.nodes),
    routing: config.routing,
    preferLocal: process.env.PREFER_LOCAL !== 'false',
    fallbackEnabled: process.env.CLAUDE_ENABLED !== 'false'
  };
}

// Legacy exports for backward compatibility
async function callChatGPT(systemPrompt, userPrompt, options = {}) {
  console.warn('callChatGPT is deprecated, use callAI with taskType instead');
  return callClaude(systemPrompt, userPrompt, options);
}

module.exports = {
  // Main interface
  callAI,
  callNode,
  
  // Direct node access
  callOllama,
  callClaude,
  callClaudeCLI,
  
  // Utilities
  getNodeStatus,
  calculateCost,
  testProvider,
  getAIConfig,
  loadConfig,
  checkOllamaHealth,
  
  // Legacy
  callChatGPT
};
