# M1 Mac Studio Setup Guide - Code Generation Node

> **Hardware:** M1 Mac Studio, 64GB Unified Memory  
> **Role:** Primary local code generation node  
> **Model:** Qwen2.5-Coder-32B-Instruct (current SOTA for code)

## Why Qwen2.5-Coder-32B?

Based on current benchmarks (Dec 2025):

| Model | HumanEval | Aider Benchmark | Memory Required |
|-------|-----------|-----------------|-----------------|
| **Qwen2.5-Coder-32B** | 88.4% | 74% (ties GPT-4o) | ~32GB |
| Claude 3.5 Sonnet | - | 84% | Cloud only |
| GPT-4o | 90.2% | 71% | Cloud only |
| DeepSeek-Coder-V2 | 81.1% | - | ~40GB |

Qwen2.5-Coder-32B is the best model that fits comfortably in 64GB while leaving headroom for the OS and other processes.

---

## Step 1: Install Ollama

```bash
# Install via Homebrew
brew install ollama

# Verify installation
ollama --version
```

## Step 2: Configure Ollama for Network Access

By default, Ollama only listens on localhost. To allow the Mac Mini orchestrator to connect:

```bash
# Create/edit the Ollama environment file
sudo mkdir -p /etc/ollama

# Create configuration for network access
cat << 'EOF' | sudo tee /etc/ollama/ollama.env
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_ORIGINS=*
OLLAMA_NUM_PARALLEL=2
OLLAMA_MAX_LOADED_MODELS=1
EOF
```

### Option A: Run Ollama as a Service (Recommended)

```bash
# Create LaunchAgent for auto-start
mkdir -p ~/Library/LaunchAgents

cat << 'EOF' > ~/Library/LaunchAgents/com.ollama.server.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/ollama</string>
        <string>serve</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OLLAMA_HOST</key>
        <string>0.0.0.0:11434</string>
        <key>OLLAMA_ORIGINS</key>
        <string>*</string>
        <key>OLLAMA_NUM_PARALLEL</key>
        <string>2</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/ollama.out.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ollama.err.log</string>
</dict>
</plist>
EOF

# Load the service
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

# Verify it's running
curl http://localhost:11434/api/tags
```

### Option B: Manual Start

```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

## Step 3: Pull Qwen2.5-Coder-32B

```bash
# Pull the model (downloads ~20GB)
ollama pull qwen2.5-coder:32b

# Verify the model is available
ollama list
```

Expected output:
```
NAME                    ID              SIZE      MODIFIED
qwen2.5-coder:32b       abc123def456    20 GB     Just now
```

## Step 4: Test Local Inference

```bash
# Quick test
ollama run qwen2.5-coder:32b "Write a Python function to merge two sorted lists"

# API test
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5-coder:32b",
  "prompt": "Write a TypeScript function to debounce API calls",
  "stream": false
}'
```

## Step 5: Performance Tuning

### Memory Settings

With 64GB, you have ~32GB for the model and 32GB for OS/apps. Optimize with:

```bash
# Add to your shell profile (~/.zshrc or ~/.bash_profile)
export OLLAMA_NUM_PARALLEL=2      # Concurrent requests
export OLLAMA_MAX_LOADED_MODELS=1 # Only one model in memory
export OLLAMA_KEEP_ALIVE="10m"    # Unload after 10 min idle
```

### Create Custom Modelfile for Coding

```bash
# Create optimized coding model configuration
cat << 'EOF' > ~/Modelfile-code
FROM qwen2.5-coder:32b

# Optimized for code generation
PARAMETER temperature 0.2
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 16384
PARAMETER stop "<|endoftext|>"
PARAMETER stop "<|im_end|>"

SYSTEM """You are an expert software engineer. Generate clean, well-documented, production-ready code. Follow best practices for the language being used. Include error handling and type hints where appropriate."""
EOF

# Create the custom model
ollama create specmas-coder -f ~/Modelfile-code

# Test it
ollama run specmas-coder "Create a Node.js Express middleware for rate limiting"
```

## Step 6: Network Configuration

### Find Your Mac Studio's IP

```bash
# Get the local IP address
ipconfig getifaddr en0  # or en1 for some Macs
```

### Firewall Configuration

```bash
# Allow incoming connections on port 11434
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /opt/homebrew/bin/ollama
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /opt/homebrew/bin/ollama
```

### Test Remote Access (from Mac Mini)

```bash
# Replace MAC_STUDIO_IP with actual IP
curl http://MAC_STUDIO_IP:11434/api/tags
```

## Step 7: Health Check Script

Create a health check script for monitoring:

```bash
cat << 'EOF' > ~/bin/ollama-health.sh
#!/bin/bash

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "ERROR: Ollama not responding"
    exit 1
fi

# Check model availability
if ! ollama list | grep -q "qwen2.5-coder:32b"; then
    echo "WARNING: qwen2.5-coder:32b not loaded"
    exit 1
fi

# Check memory usage
MEMORY_PRESSURE=$(memory_pressure | grep "System-wide memory free percentage" | awk '{print $5}' | tr -d '%')
if [ "$MEMORY_PRESSURE" -lt 20 ]; then
    echo "WARNING: Low memory ($MEMORY_PRESSURE% free)"
fi

echo "OK: Ollama healthy, qwen2.5-coder:32b available"
exit 0
EOF

chmod +x ~/bin/ollama-health.sh
```

---

## Performance Expectations

| Metric | Expected Value |
|--------|----------------|
| **Prompt Processing** | ~95 tokens/sec |
| **Token Generation** | ~10-12 tokens/sec |
| **Memory Usage** | ~32-34 GB |
| **Time to First Token** | ~1-2 seconds |
| **Typical Code Response** | 20-60 seconds |

---

## Alternative: MLX for Higher Performance

If you want faster inference, MLX is optimized for Apple Silicon:

```bash
# Install MLX
pip install mlx-lm

# Run with MLX (slightly faster on Apple Silicon)
mlx_lm.generate \
  --model mlx-community/Qwen2.5-Coder-32B-Instruct-8bit \
  --max-tokens 4000 \
  --prompt "Your prompt here"
```

However, Ollama is recommended for Spec-MAS integration due to its REST API.

---

## Troubleshooting

### Model Won't Load
```bash
# Check available memory
vm_stat | head -5

# Force unload any loaded models
curl http://localhost:11434/api/generate -d '{"model": "qwen2.5-coder:32b", "keep_alive": 0}'
```

### Slow Generation
```bash
# Reduce context size
ollama run qwen2.5-coder:32b --num-ctx 8192 "Your prompt"
```

### Connection Refused from Remote
```bash
# Verify Ollama is listening on all interfaces
lsof -i :11434
# Should show: ollama ... *:11434 (LISTEN)
```

---

## Next Steps

Once the Mac Studio is configured, proceed to:
1. [DGX-SPARK-SETUP.md](./DGX-SPARK-SETUP.md) - Configure the DGX Spark
2. [MAC-MINI-ORCHESTRATOR.md](./MAC-MINI-ORCHESTRATOR.md) - Set up Spec-MAS on Mac Mini
3. [MULTI-BACKEND-CONFIG.md](./MULTI-BACKEND-CONFIG.md) - Configure routing between nodes
