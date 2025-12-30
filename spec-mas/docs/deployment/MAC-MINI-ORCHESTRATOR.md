# Intel Mac Mini Orchestrator Setup Guide

> **Hardware:** Intel Mac Mini, 8GB RAM  
> **Role:** Spec-MAS orchestration, task routing, coordination  
> **Note:** No local inference - all AI calls routed to Mac Studio, DGX Spark, or Claude API

## Overview

The Mac Mini serves as the central orchestrator:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mac Mini (Orchestrator)                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Spec-MAS    │  │   Routing    │  │   Cost Tracking      │  │
│  │  CLI/Scripts │  │   Logic      │  │   & Monitoring       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Mac Studio    │  │   DGX Spark    │  │   Claude API    │
│   (Fast Code)   │  │   (Heavy)      │  │   (Fallback)    │
│   qwen2.5-32b   │  │   qwen2.5-72b  │  │   claude-sonnet │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Step 1: Prerequisites

### Install Homebrew (if not present)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install Node.js 18+

```bash
brew install node@20
echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

### Install Git

```bash
brew install git
```

---

## Step 2: Clone Spec-MAS

```bash
cd ~/repos  # or your preferred directory
git clone https://github.com/yourusername/Spec-MAS.git
cd Spec-MAS
```

---

## Step 3: Install Dependencies

```bash
npm install
```

---

## Step 4: Environment Configuration

Create the main `.env` file:

```bash
cat << 'EOF' > .env
# =============================================================================
# SPEC-MAS DISTRIBUTED CONFIGURATION
# =============================================================================

# Primary AI Provider (routes to local nodes first)
AI_PROVIDER=distributed

# Mac Studio Configuration (Primary for code generation)
MAC_STUDIO_HOST=192.168.1.50        # Replace with actual IP
MAC_STUDIO_PORT=11434
MAC_STUDIO_MODEL=specmas-coder       # Custom model we created
MAC_STUDIO_ENABLED=true

# DGX Spark Configuration (Heavy lifting)
DGX_SPARK_HOST=192.168.1.100        # Replace with actual IP
DGX_SPARK_PORT=11434
DGX_SPARK_MODEL=specmas-heavy        # Custom model for complex tasks
DGX_SPARK_ENABLED=true

# Claude API Configuration (Fallback / Complex reasoning)
ANTHROPIC_API_KEY=sk-ant-api03-...   # Your Anthropic API key
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_ENABLED=true
CLAUDE_FALLBACK_ONLY=true            # Only use when local nodes fail

# Routing Configuration
ROUTING_STRATEGY=cost-optimized      # Options: cost-optimized, speed-optimized, quality-optimized
MAX_LOCAL_RETRIES=2                  # Retry local nodes before falling back to Claude
PREFER_LOCAL=true                    # Always try local first

# Cost Tracking
SPECMAS_BUDGET_WARNING=50.00         # Alert at $50
SPECMAS_BUDGET_LIMIT=150.00          # Hard limit at $150
TRACK_LOCAL_COSTS=true               # Track estimated local costs too

# Output Configuration
OUTPUT_DIR=implementation-output
REPORTS_DIR=.specmas/reports

# Logging
LOG_LEVEL=info
LOG_AI_CALLS=true
EOF
```

---

## Step 5: Create Multi-Backend AI Helper

Replace the existing `ai-helper.js` with a distributed version:

```bash
# Backup original
cp spec-mas/scripts/ai-helper.js spec-mas/scripts/ai-helper.js.backup
```

Create the new distributed AI helper (see [MULTI-BACKEND-CONFIG.md](./MULTI-BACKEND-CONFIG.md) for full implementation).

---

## Step 6: Create Network Configuration File

```bash
cat << 'EOF' > .specmas/network-config.json
{
  "nodes": {
    "mac-studio": {
      "name": "Mac Studio (Code Gen)",
      "host": "192.168.1.50",
      "port": 11434,
      "type": "ollama",
      "models": {
        "default": "specmas-coder",
        "fast": "qwen2.5-coder:32b"
      },
      "capabilities": ["code-generation", "code-review", "test-generation"],
      "priority": 1,
      "maxConcurrent": 2,
      "healthCheck": "/api/tags"
    },
    "dgx-spark": {
      "name": "DGX Spark (Heavy)",
      "host": "192.168.1.100",
      "port": 11434,
      "type": "ollama",
      "models": {
        "default": "specmas-heavy",
        "reasoning": "qwen2.5:72b",
        "batch": "specmas-batch"
      },
      "capabilities": ["complex-reasoning", "architecture-review", "batch-processing"],
      "priority": 2,
      "maxConcurrent": 4,
      "healthCheck": "/api/tags"
    },
    "claude-api": {
      "name": "Claude API (Fallback)",
      "type": "anthropic",
      "models": {
        "default": "claude-sonnet-4-20250514",
        "complex": "claude-sonnet-4-20250514"
      },
      "capabilities": ["all"],
      "priority": 99,
      "fallbackOnly": true,
      "healthCheck": null
    }
  },
  "routing": {
    "code-generation": ["mac-studio", "dgx-spark", "claude-api"],
    "code-review": ["mac-studio", "claude-api"],
    "test-generation": ["mac-studio", "dgx-spark"],
    "architecture-review": ["dgx-spark", "claude-api"],
    "complex-reasoning": ["dgx-spark", "claude-api"],
    "batch-processing": ["dgx-spark"],
    "default": ["mac-studio", "dgx-spark", "claude-api"]
  }
}
EOF
```

---

## Step 7: Create Health Check Script

```bash
cat << 'EOF' > scripts/check-nodes.sh
#!/bin/bash

echo "=== Spec-MAS Node Health Check ==="
echo ""

# Load config
MAC_STUDIO_HOST="${MAC_STUDIO_HOST:-192.168.1.50}"
DGX_SPARK_HOST="${DGX_SPARK_HOST:-192.168.1.100}"

# Check Mac Studio
echo "Mac Studio ($MAC_STUDIO_HOST:11434):"
if curl -s --connect-timeout 2 "http://$MAC_STUDIO_HOST:11434/api/tags" > /dev/null 2>&1; then
    MODELS=$(curl -s "http://$MAC_STUDIO_HOST:11434/api/tags" | jq -r '.models[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
    echo "  ✓ Online - Models: $MODELS"
else
    echo "  ✗ Offline or unreachable"
fi
echo ""

# Check DGX Spark
echo "DGX Spark ($DGX_SPARK_HOST:11434):"
if curl -s --connect-timeout 2 "http://$DGX_SPARK_HOST:11434/api/tags" > /dev/null 2>&1; then
    MODELS=$(curl -s "http://$DGX_SPARK_HOST:11434/api/tags" | jq -r '.models[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
    echo "  ✓ Online - Models: $MODELS"
else
    echo "  ✗ Offline or unreachable"
fi
echo ""

# Check Claude API
echo "Claude API:"
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "  ✓ API Key configured"
else
    echo "  ✗ API Key not set (ANTHROPIC_API_KEY)"
fi
echo ""

echo "=== Summary ==="
ONLINE=0
TOTAL=3

curl -s --connect-timeout 2 "http://$MAC_STUDIO_HOST:11434/api/tags" > /dev/null 2>&1 && ((ONLINE++))
curl -s --connect-timeout 2 "http://$DGX_SPARK_HOST:11434/api/tags" > /dev/null 2>&1 && ((ONLINE++))
[ -n "$ANTHROPIC_API_KEY" ] && ((ONLINE++))

echo "Nodes available: $ONLINE/$TOTAL"
EOF

chmod +x scripts/check-nodes.sh
```

---

## Step 8: Test the Setup

### Check All Nodes

```bash
# Source environment
source .env

# Run health check
./scripts/check-nodes.sh
```

### Test Individual Nodes

```bash
# Test Mac Studio directly
curl http://192.168.1.50:11434/api/generate -d '{
  "model": "qwen2.5-coder:32b",
  "prompt": "Write hello world in Python",
  "stream": false
}'

# Test DGX Spark directly
curl http://192.168.1.100:11434/api/generate -d '{
  "model": "qwen2.5:72b",
  "prompt": "Explain dependency injection",
  "stream": false
}'
```

### Test Spec-MAS Pipeline

```bash
# Validate a sample spec
npm run validate-spec specs/examples/001-sample-dashboard.md

# Run a dry-run implementation
npm run implement-spec specs/examples/001-sample-dashboard.md --dry-run
```

---

## Step 9: Create Launch Script

```bash
cat << 'EOF' > start-specmas.sh
#!/bin/bash

# Load environment
set -a
source .env
set +a

# Check nodes
echo "Checking node availability..."
./scripts/check-nodes.sh

echo ""
echo "Starting Spec-MAS..."
echo "Available commands:"
echo "  npm run validate-spec <spec-file>"
echo "  npm run review-spec <spec-file>"
echo "  npm run implement-spec <spec-file>"
echo "  npm run implement-spec <spec-file> --dry-run"
echo ""
echo "Dashboard: http://localhost:3000 (if running)"
EOF

chmod +x start-specmas.sh
```

---

## Step 10: Optional - Web Dashboard

For monitoring, you can run a simple dashboard:

```bash
# Install dashboard dependencies
npm install express socket.io

# Create dashboard (optional enhancement)
# See spec-mas/scripts/dashboard.js for implementation
```

---

## Directory Structure

After setup, your Mac Mini should have:

```
~/repos/Spec-MAS/
├── .env                          # Main configuration
├── .specmas/
│   ├── network-config.json       # Node definitions
│   ├── metrics/                  # Usage tracking
│   └── reports/                  # Generated reports
├── scripts/
│   └── check-nodes.sh            # Health check script
├── spec-mas/
│   ├── scripts/
│   │   ├── ai-helper.js          # Distributed AI helper
│   │   └── ...
│   └── ...
├── specs/                        # Your specifications
└── implementation-output/        # Generated code
```

---

## Usage Workflow

### Daily Workflow

```bash
# 1. Start your session
cd ~/repos/Spec-MAS
./start-specmas.sh

# 2. Create/edit a spec
code specs/features/my-feature.md

# 3. Validate
npm run validate-spec specs/features/my-feature.md

# 4. Review (optional, uses DGX Spark or Claude)
npm run review-spec specs/features/my-feature.md

# 5. Implement (uses Mac Studio for code gen)
npm run implement-spec specs/features/my-feature.md
```

### Overnight Autonomous Workflow

For your 22-hour autonomous development vision:

```bash
# Queue multiple specs for overnight processing
./scripts/batch-process.sh specs/features/*.md --parallel --budget 100

# This will:
# 1. Validate all specs
# 2. Route to appropriate nodes based on complexity
# 3. Generate code with checkpointing
# 4. Create git branches and commits
# 5. Generate summary report
```

---

## Troubleshooting

### Cannot Connect to Mac Studio

```bash
# Check network connectivity
ping 192.168.1.50

# Check if Ollama is listening
nc -zv 192.168.1.50 11434

# On Mac Studio, verify binding
lsof -i :11434
```

### Cannot Connect to DGX Spark

```bash
# Check SSH access first
ssh dgx-spark

# Check Ollama service
ssh dgx-spark "systemctl status ollama"
```

### All Local Nodes Failing

```bash
# Check if Claude fallback is working
npm run validate-spec specs/examples/001-sample-dashboard.md --force-claude
```

---

## Next Steps

1. [MULTI-BACKEND-CONFIG.md](./MULTI-BACKEND-CONFIG.md) - Detailed routing configuration
2. Update `ai-helper.js` with distributed backend support
3. Configure overnight batch processing
