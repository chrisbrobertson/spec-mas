# NVIDIA DGX Spark Setup Guide - Heavy Lifting Node

> **Hardware:** NVIDIA DGX Spark, 128GB Unified Memory, GB10 Grace Blackwell  
> **Role:** Large model inference, batch processing, fine-tuning  
> **OS:** DGX OS (Ubuntu-based, ARM64)

## DGX Spark Specifications

| Spec | Value |
|------|-------|
| **Memory** | 128GB LPDDR5x unified |
| **Memory Bandwidth** | 273 GB/s |
| **CPU** | 20 ARM cores (10x Cortex-X925 + 10x Cortex-A725) |
| **AI Performance** | 1 PFLOP FP4 |
| **Storage** | 4TB NVMe |
| **Network** | 2x QSFP (200 Gb/s aggregate) |

### When to Use DGX Spark vs Mac Studio

| Use Case | Best Node |
|----------|-----------|
| Fast code completion | Mac Studio (higher bandwidth) |
| Large model (>40B) inference | DGX Spark (more memory) |
| Batch processing multiple specs | DGX Spark (better batching) |
| Fine-tuning | DGX Spark (CUDA support) |
| Quick iterations | Mac Studio |

---

## Step 1: Initial Setup

### Connect to DGX Spark

```bash
# Option 1: Direct HDMI + USB peripherals
# Option 2: SSH (recommended for headless operation)
ssh dgx-spark.local  # or use IP address
```

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Verify GPU Access

```bash
nvidia-smi
# Should show GB10 GPU with 128GB unified memory

nvcc --version
# Should show CUDA 13.x
```

---

## Step 2: Install Ollama

```bash
# Install Ollama for ARM64 Linux
curl -fsSL https://ollama.com/install.sh | sh

# Verify installation
ollama --version
```

### Configure Network Access

```bash
# Create systemd override for network access
sudo mkdir -p /etc/systemd/system/ollama.service.d

sudo tee /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="OLLAMA_MAX_LOADED_MODELS=2"
EOF

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart ollama
sudo systemctl enable ollama

# Verify
curl http://localhost:11434/api/tags
```

---

## Step 3: Model Selection for DGX Spark

With 128GB, the DGX Spark can run larger models. Recommended options:

### Option A: Qwen2.5-72B (Best quality, fits comfortably)

```bash
# Pull 72B model (~45GB quantized)
ollama pull qwen2.5:72b

# Test
ollama run qwen2.5:72b "Explain the visitor pattern in software design"
```

### Option B: DeepSeek-Coder-V2-Lite (Specialized for code)

```bash
# Pull DeepSeek Coder (21B active parameters, MoE)
ollama pull deepseek-coder-v2:16b

# Test
ollama run deepseek-coder-v2:16b "Write a Rust async HTTP client with retry logic"
```

### Option C: Qwen2.5-Coder-32B (Same as Mac Studio, for consistency)

```bash
ollama pull qwen2.5-coder:32b
```

### Option D: Multiple Models for Different Tasks

```bash
# Pull multiple models
ollama pull qwen2.5:72b          # Complex reasoning
ollama pull qwen2.5-coder:32b    # Standard code gen
ollama pull deepseek-coder-v2:16b # Lightweight code tasks
```

---

## Step 4: Create Spec-MAS Optimized Models

### Heavy Reasoning Model (for complex specs)

```bash
cat << 'EOF' > /tmp/Modelfile-heavy
FROM qwen2.5:72b

PARAMETER temperature 0.3
PARAMETER top_p 0.85
PARAMETER num_ctx 32768
PARAMETER num_predict 8192

SYSTEM """You are a senior software architect. Analyze specifications thoroughly, identify edge cases, and generate comprehensive, production-ready implementations. Consider security, performance, and maintainability in all solutions."""
EOF

ollama create specmas-heavy -f /tmp/Modelfile-heavy
```

### Batch Processing Model (for multiple files)

```bash
cat << 'EOF' > /tmp/Modelfile-batch
FROM qwen2.5-coder:32b

PARAMETER temperature 0.1
PARAMETER top_p 0.9
PARAMETER num_ctx 16384
PARAMETER num_predict 4096

SYSTEM """You are a code generation engine. Generate clean, consistent code following the exact specifications provided. Focus on correctness and consistency across files."""
EOF

ollama create specmas-batch -f /tmp/Modelfile-batch
```

---

## Step 5: SGLang Setup (Optional - Higher Performance)

SGLang offers better batching performance on DGX Spark:

```bash
# Install SGLang
pip install sglang[all]

# Serve model with SGLang
python -m sglang.launch_server \
  --model-path Qwen/Qwen2.5-Coder-32B-Instruct \
  --port 30000 \
  --mem-fraction-static 0.8
```

However, Ollama is recommended for simpler integration.

---

## Step 6: vLLM Setup (Alternative - Production Grade)

For production workloads with high throughput:

```bash
# Install vLLM
pip install vllm

# Serve model
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-32B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 16384
```

---

## Step 7: Network Configuration

### Set Static IP (Recommended)

```bash
# Edit netplan configuration
sudo nano /etc/netplan/01-network-config.yaml
```

```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 192.168.1.100/24  # Adjust for your network
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

```bash
sudo netplan apply
```

### Firewall Rules

```bash
# Allow Ollama port
sudo ufw allow 11434/tcp

# Allow vLLM port (if using)
sudo ufw allow 8000/tcp

# Enable firewall
sudo ufw enable
```

---

## Step 8: Health Monitoring

### Create Health Check Script

```bash
cat << 'EOF' > ~/ollama-health.sh
#!/bin/bash

echo "=== DGX Spark Health Check ==="
echo ""

# GPU Status
echo "GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total,temperature.gpu --format=csv,noheader
echo ""

# Ollama Status
echo "Ollama Status:"
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "  Service: Running"
    echo "  Models:"
    curl -s http://localhost:11434/api/tags | jq -r '.models[].name' | sed 's/^/    - /'
else
    echo "  Service: NOT RUNNING"
fi
echo ""

# Memory Status
echo "Memory Status:"
free -h | grep -E "Mem|Swap"
echo ""

# Disk Status
echo "Disk Status:"
df -h / | tail -1
EOF

chmod +x ~/ollama-health.sh
```

### Create Systemd Timer for Monitoring

```bash
# Create monitoring service
sudo tee /etc/systemd/system/ollama-health.service << 'EOF'
[Unit]
Description=Ollama Health Check

[Service]
Type=oneshot
ExecStart=/home/ubuntu/ollama-health.sh
StandardOutput=journal
EOF

# Create timer (runs every 5 minutes)
sudo tee /etc/systemd/system/ollama-health.timer << 'EOF'
[Unit]
Description=Run Ollama Health Check

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now ollama-health.timer
```

---

## Performance Expectations

### Qwen2.5-Coder-32B on DGX Spark

| Metric | Single Request | Batch (4 concurrent) |
|--------|----------------|----------------------|
| Prefill | ~8,000 tok/s | ~7,500 tok/s |
| Decode | ~50 tok/s | ~180 tok/s total |
| Time to First Token | ~2-3s | ~3-4s |

### Qwen2.5-72B on DGX Spark

| Metric | Value |
|--------|-------|
| Prefill | ~4,000 tok/s |
| Decode | ~25 tok/s |
| Memory Usage | ~60GB |

> **Note:** The DGX Spark's memory bandwidth (273 GB/s) is the main bottleneck. It excels at batch processing where throughput matters more than latency.

---

## Dual DGX Spark Setup (Optional)

If you have two DGX Sparks, they can be connected for larger models:

```bash
# On both nodes, configure network interfaces
# Follow NVIDIA's official "Connect Two Sparks" playbook
# This enables models up to 405B parameters
```

---

## Troubleshooting

### Out of Memory

```bash
# Check what's using memory
nvidia-smi

# Reduce context size
ollama run qwen2.5:72b --num-ctx 8192 "Your prompt"

# Unload unused models
curl http://localhost:11434/api/generate -d '{"model": "model-name", "keep_alive": 0}'
```

### Slow Performance

```bash
# Check GPU utilization
watch -n 1 nvidia-smi

# If GPU utilization is low, the bottleneck is memory bandwidth
# Consider using smaller models or batching requests
```

### CUDA Errors

```bash
# Check CUDA version compatibility
nvcc --version

# Reinstall CUDA drivers if needed
sudo apt install --reinstall nvidia-driver-*
```

---

## Next Steps

1. [MAC-MINI-ORCHESTRATOR.md](./MAC-MINI-ORCHESTRATOR.md) - Set up Spec-MAS on Mac Mini
2. [MULTI-BACKEND-CONFIG.md](./MULTI-BACKEND-CONFIG.md) - Configure routing between all nodes
