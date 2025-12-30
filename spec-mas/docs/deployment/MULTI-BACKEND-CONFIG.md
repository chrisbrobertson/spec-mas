# Multi-Backend Configuration Guide

> Complete configuration for routing AI requests between Mac Studio, DGX Spark, and Claude API

## Architecture Overview

```
                           ┌─────────────────────────────┐
                           │      Spec-MAS Request       │
                           │   (validate, review, gen)   │
                           └──────────────┬──────────────┘
                                          │
                                          ▼
                           ┌─────────────────────────────┐
                           │      Routing Engine         │
                           │  - Task classification      │
                           │  - Node health check        │
                           │  - Load balancing           │
                           └──────────────┬──────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
    │   Mac Studio    │         │   DGX Spark     │         │   Claude API    │
    │                 │         │                 │         │                 │
    │ • Fast code gen │         │ • Heavy compute │         │ • Fallback      │
    │ • 64GB / 400GB/s│         │ • 128GB/273GB/s │         │ • Complex tasks │
    │ • ~10-12 tok/s  │         │ • ~50 tok/s     │         │ • Long context  │
    │                 │         │   (batched)     │         │                 │
    │ qwen2.5-coder   │         │ qwen2.5-72b     │         │ claude-sonnet   │
    └─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Task Routing Strategy

| Task Type | Primary Node | Fallback | Reason |
|-----------|--------------|----------|--------|
| Code generation (simple) | Mac Studio | DGX Spark | Faster latency |
| Code generation (complex) | DGX Spark | Claude | Better reasoning |
| Code review | Mac Studio | Claude | Quick turnaround |
| Architecture review | DGX Spark | Claude | Needs larger context |
| Test generation | Mac Studio | DGX Spark | Standard complexity |
| Security review | DGX Spark | Claude | Thorough analysis |
| Batch processing | DGX Spark | - | Better throughput |

---

## Configuration Files

### 1. Environment Variables (.env)

```bash
# =============================================================================
# NODE CONFIGURATION
# =============================================================================

# Mac Studio
MAC_STUDIO_HOST=192.168.1.50
MAC_STUDIO_PORT=11434
MAC_STUDIO_ENABLED=true

# DGX Spark  
DGX_SPARK_HOST=192.168.1.100
DGX_SPARK_PORT=11434
DGX_SPARK_ENABLED=true

# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
CLAUDE_ENABLED=true

# =============================================================================
# ROUTING CONFIGURATION
# =============================================================================

# Strategy: cost-optimized | speed-optimized | quality-optimized
ROUTING_STRATEGY=cost-optimized

# Prefer local nodes over cloud
PREFER_LOCAL=true

# Max retries before fallback
MAX_LOCAL_RETRIES=2

# Timeout for node health checks (ms)
HEALTH_CHECK_TIMEOUT=5000

# =============================================================================
# COST TRACKING
# =============================================================================

# Estimated costs for local inference (per 1M tokens)
LOCAL_INPUT_COST=0.00      # Free for local
LOCAL_OUTPUT_COST=0.00     # Free for local

# Claude costs (per 1M tokens)
CLAUDE_INPUT_COST=3.00
CLAUDE_OUTPUT_COST=15.00

# Budget limits
SPECMAS_BUDGET_WARNING=50.00
SPECMAS_BUDGET_LIMIT=150.00
```

### 2. Network Configuration (.specmas/network-config.json)

```json
{
  "version": "1.0",
  "nodes": {
    "mac-studio": {
      "name": "Mac Studio",
      "host": "192.168.1.50",
      "port": 11434,
      "protocol": "http",
      "type": "ollama",
      "enabled": true,
      "models": {
        "default": "qwen2.5-coder:32b",
        "code": "specmas-coder",
        "fast": "qwen2.5-coder:7b"
      },
      "capabilities": {
        "code-generation": { "priority": 1, "maxTokens": 16384 },
        "code-review": { "priority": 1, "maxTokens": 8192 },
        "test-generation": { "priority": 1, "maxTokens": 8192 }
      },
      "limits": {
        "maxConcurrent": 2,
        "requestTimeout": 300000,
        "maxContextLength": 32768
      },
      "performance": {
        "avgLatencyMs": 1500,
        "tokensPerSecond": 10
      }
    },
    "dgx-spark": {
      "name": "DGX Spark",
      "host": "192.168.1.100",
      "port": 11434,
      "protocol": "http",
      "type": "ollama",
      "enabled": true,
      "models": {
        "default": "qwen2.5:72b",
        "heavy": "specmas-heavy",
        "batch": "specmas-batch",
        "code": "qwen2.5-coder:32b"
      },
      "capabilities": {
        "code-generation": { "priority": 2, "maxTokens": 32768 },
        "architecture-review": { "priority": 1, "maxTokens": 32768 },
        "complex-reasoning": { "priority": 1, "maxTokens": 32768 },
        "batch-processing": { "priority": 1, "maxTokens": 16384 },
        "security-review": { "priority": 1, "maxTokens": 16384 }
      },
      "limits": {
        "maxConcurrent": 4,
        "requestTimeout": 600000,
        "maxContextLength": 65536
      },
      "performance": {
        "avgLatencyMs": 3000,
        "tokensPerSecond": 50
      }
    },
    "claude-api": {
      "name": "Claude API",
      "type": "anthropic",
      "enabled": true,
      "fallbackOnly": true,
      "models": {
        "default": "claude-sonnet-4-20250514",
        "complex": "claude-sonnet-4-20250514"
      },
      "capabilities": {
        "code-generation": { "priority": 99, "maxTokens": 8192 },
        "code-review": { "priority": 99, "maxTokens": 8192 },
        "architecture-review": { "priority": 2, "maxTokens": 8192 },
        "complex-reasoning": { "priority": 2, "maxTokens": 8192 }
      },
      "limits": {
        "maxConcurrent": 10,
        "requestTimeout": 120000,
        "maxContextLength": 200000
      },
      "costs": {
        "inputPer1M": 3.00,
        "outputPer1M": 15.00
      }
    }
  },
  "routing": {
    "defaultStrategy": "cost-optimized",
    "strategies": {
      "cost-optimized": {
        "preferLocal": true,
        "fallbackToCloud": true,
        "order": ["mac-studio", "dgx-spark", "claude-api"]
      },
      "speed-optimized": {
        "preferLocal": true,
        "fallbackToCloud": true,
        "order": ["mac-studio", "claude-api", "dgx-spark"]
      },
      "quality-optimized": {
        "preferLocal": false,
        "fallbackToCloud": true,
        "order": ["dgx-spark", "claude-api", "mac-studio"]
      }
    }
  },
  "healthCheck": {
    "enabled": true,
    "intervalMs": 30000,
    "timeoutMs": 5000,
    "endpoints": {
      "ollama": "/api/tags",
      "anthropic": null
    }
  }
}
```

---

## Implementation: Distributed AI Helper

Replace `spec-mas/scripts/ai-helper.js` with this implementation:

```javascript
/**
 * Spec-MAS Distributed AI Helper
 * 
 * Routes AI requests between:
 * - Mac Studio (Ollama - fast code generation)
 * - DGX Spark (Ollama - heavy compute)
 * - Claude API (fallback / complex reasoning)
 */

const fs = require('fs');
const path = require('path');

// Load configuration
const loadConfig = () => {
  const configPath = path.join(process.cwd(), '.specmas', 'network-config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return getDefaultConfig();
};

const getDefaultConfig = () => ({
  nodes: {
    'mac-studio': {
      host: process.env.MAC_STUDIO_HOST || '192.168.1.50',
      port: process.env.MAC_STUDIO_PORT || 11434,
      type: 'ollama',
      enabled: process.env.MAC_STUDIO_ENABLED !== 'false',
      models: { default: 'qwen2.5-coder:32b' }
    },
    'dgx-spark': {
      host: process.env.DGX_SPARK_HOST || '192.168.1.100',
      port: process.env.DGX_SPARK_PORT || 11434,
      type: 'ollama',
      enabled: process.env.DGX_SPARK_ENABLED !== 'false',
      models: { default: 'qwen2.5:72b' }
    },
    'claude-api': {
      type: 'anthropic',
      enabled: process.env.CLAUDE_ENABLED !== 'false',
      fallbackOnly: process.env.CLAUDE_FALLBACK_ONLY === 'true',
      models: { default: 'claude-sonnet-4-20250514' }
    }
  }
});

// Node health status cache
const nodeHealth = new Map();

/**
 * Check if an Ollama node is healthy
 */
async function checkOllamaHealth(node) {
  const cacheKey = `${node.host}:${node.port}`;
  const cached = nodeHealth.get(cacheKey);
  
  // Use cache if less than 30 seconds old
  if (cached && Date.now() - cached.timestamp < 30000) {
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
  const model = options.model || node.models?.default || 'qwen2.5-coder:32b';
  const url = `http://${node.host}:${node.port}/api/generate`;
  
  // Combine system and user prompts
  let prompt = userPrompt;
  if (systemPrompt) {
    prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userPrompt}<|im_end|>\n<|im_start|>assistant\n`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.2,
        top_p: options.top_p ?? 0.9,
        num_ctx: options.num_ctx ?? 16384,
        num_predict: options.maxTokens ?? 4096
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.response,
    tokens: {
      input: data.prompt_eval_count || 0,
      output: data.eval_count || 0
    },
    provider: node.name || 'ollama',
    model,
    node: node.host
  };
}

/**
 * Call Claude API
 */
async function callClaude(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const model = options.model || 'claude-sonnet-4-20250514';
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens || 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.content[0].text,
    tokens: {
      input: data.usage.input_tokens,
      output: data.usage.output_tokens
    },
    provider: 'claude-api',
    model
  };
}

/**
 * Select best node for task
 */
async function selectNode(taskType, config) {
  const strategy = process.env.ROUTING_STRATEGY || 'cost-optimized';
  const preferLocal = process.env.PREFER_LOCAL !== 'false';
  
  // Get nodes in priority order
  const nodeOrder = preferLocal 
    ? ['mac-studio', 'dgx-spark', 'claude-api']
    : ['claude-api', 'mac-studio', 'dgx-spark'];

  // Check task-specific routing
  const taskRouting = {
    'code-generation': ['mac-studio', 'dgx-spark', 'claude-api'],
    'code-review': ['mac-studio', 'claude-api'],
    'architecture-review': ['dgx-spark', 'claude-api'],
    'complex-reasoning': ['dgx-spark', 'claude-api'],
    'batch-processing': ['dgx-spark', 'mac-studio'],
    'security-review': ['dgx-spark', 'claude-api'],
    'test-generation': ['mac-studio', 'dgx-spark']
  };

  const orderedNodes = taskRouting[taskType] || nodeOrder;

  for (const nodeId of orderedNodes) {
    const node = config.nodes[nodeId];
    if (!node || !node.enabled) continue;
    
    // Skip Claude if it's fallback only and we haven't tried local nodes
    if (node.fallbackOnly && nodeId === orderedNodes[0]) continue;

    // Check health for Ollama nodes
    if (node.type === 'ollama') {
      const healthy = await checkOllamaHealth(node);
      if (healthy) {
        return { nodeId, node };
      }
      console.warn(`Node ${nodeId} unhealthy, trying next...`);
    } else if (node.type === 'anthropic') {
      // Claude is always "healthy" if API key is set
      if (process.env.ANTHROPIC_API_KEY) {
        return { nodeId, node };
      }
    }
  }

  throw new Error('No healthy nodes available');
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

  while (attempts < maxRetries + 1) {
    try {
      const { nodeId, node } = await selectNode(taskType, config);
      
      // Skip if we already tried this node
      if (triedNodes.has(nodeId)) {
        attempts++;
        continue;
      }
      triedNodes.add(nodeId);

      console.log(`Routing to ${nodeId} for ${taskType}...`);

      if (node.type === 'ollama') {
        return await callOllama(node, systemPrompt, userPrompt, options);
      } else if (node.type === 'anthropic') {
        return await callClaude(systemPrompt, userPrompt, options);
      }
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempts + 1} failed: ${error.message}`);
      attempts++;
    }
  }

  throw lastError || new Error('All nodes failed');
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
    if (node.type === 'ollama') {
      status[nodeId] = {
        name: node.name || nodeId,
        type: node.type,
        enabled: node.enabled,
        healthy: await checkOllamaHealth(node),
        host: `${node.host}:${node.port}`
      };
    } else if (node.type === 'anthropic') {
      status[nodeId] = {
        name: node.name || nodeId,
        type: node.type,
        enabled: node.enabled,
        healthy: !!process.env.ANTHROPIC_API_KEY,
        host: 'api.anthropic.com'
      };
    }
  }

  return status;
}

// Export functions
module.exports = {
  callAI,
  callNode,
  callOllama,
  callClaude,
  getNodeStatus,
  checkOllamaHealth,
  loadConfig
};
```

---

## Usage Examples

### Basic Code Generation

```javascript
const { callAI } = require('./ai-helper');

// Automatically routes to Mac Studio (fastest for code)
const result = await callAI(
  'You are an expert Node.js developer.',
  'Write an Express middleware for JWT authentication',
  { taskType: 'code-generation' }
);

console.log(result.content);
console.log(`Generated by: ${result.provider} (${result.node})`);
```

### Complex Architecture Review

```javascript
// Automatically routes to DGX Spark (better for complex reasoning)
const result = await callAI(
  'You are a senior software architect.',
  'Review this microservices architecture for scalability issues...',
  { taskType: 'architecture-review' }
);
```

### Force Specific Node

```javascript
const { callNode } = require('./ai-helper');

// Force use of Claude for complex reasoning
const result = await callNode('claude-api', systemPrompt, userPrompt);
```

### Check Node Status

```javascript
const { getNodeStatus } = require('./ai-helper');

const status = await getNodeStatus();
console.log(status);
// {
//   'mac-studio': { healthy: true, host: '192.168.1.50:11434' },
//   'dgx-spark': { healthy: true, host: '192.168.1.100:11434' },
//   'claude-api': { healthy: true, host: 'api.anthropic.com' }
// }
```

---

## Cost Tracking Integration

Add to your tracking:

```javascript
// After each AI call
const cost = calculateCost(result.tokens.input, result.tokens.output, result.provider);

// Local nodes are free
function calculateCost(inputTokens, outputTokens, provider) {
  if (provider === 'claude-api') {
    const inputCost = (inputTokens / 1000000) * 3.00;  // $3/1M tokens
    const outputCost = (outputTokens / 1000000) * 15.00; // $15/1M tokens
    return inputCost + outputCost;
  }
  return 0; // Local inference is free
}
```

---

## Monitoring Dashboard

Create a simple status endpoint:

```javascript
// Add to spec-mas/scripts/status-server.js
const express = require('express');
const { getNodeStatus } = require('./ai-helper');

const app = express();

app.get('/api/status', async (req, res) => {
  const status = await getNodeStatus();
  res.json(status);
});

app.listen(3001, () => {
  console.log('Status server running on http://localhost:3001');
});
```

---

## Next Steps

1. Replace `spec-mas/scripts/ai-helper.js` with the distributed version above
2. Create `.specmas/network-config.json` with your actual IPs
3. Update `.env` with your configuration
4. Run `./scripts/check-nodes.sh` to verify connectivity
5. Test with `npm run validate-spec specs/examples/001-sample-dashboard.md`
