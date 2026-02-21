#!/usr/bin/env python3
"""
BlackRoad LLM Response Templates
Teach the model how to respond with examples
"""
import json
from datetime import datetime

print("📝 BLACKROAD LLM RESPONSE TEMPLATES")
print("=" * 70)
print()

# ============================================================================
# RESPONSE TEMPLATES WITH EXAMPLES
# ============================================================================

templates = {
    "deployment_scripts": {
        "description": "Generate deployment scripts for various platforms",
        "examples": [
            {
                "prompt": "Create a deployment script for Railway",
                "response": """#!/bin/bash
# Deploy service to Railway
# Usage: ./deploy-to-railway.sh <service-name>

set -e

SERVICE_NAME="${1:-blackroad-service}"

echo "🚀 Deploying $SERVICE_NAME to Railway..."

# Build
echo "📦 Building..."
npm run build

# Deploy
echo "🚂 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "📊 Check status: railway status"
echo "📝 View logs: railway logs"
""",
                "tags": ["deployment", "railway", "bash"]
            },
            {
                "prompt": "Create a deployment script for Cloudflare Pages",
                "response": """#!/bin/bash
# Deploy to Cloudflare Pages
# Usage: ./deploy-to-cloudflare.sh <project-name>

set -e

PROJECT_NAME="${1:-blackroad-project}"
DIR="${2:-.next/static}"

echo "☁️  Deploying to Cloudflare Pages..."

# Build
echo "📦 Building..."
npm run build

# Deploy
echo "🚀 Deploying $PROJECT_NAME..."
wrangler pages deploy $DIR --project-name=$PROJECT_NAME

echo "✅ Deployed to Cloudflare Pages!"
echo "🌐 View at: https://$PROJECT_NAME.pages.dev"
""",
                "tags": ["deployment", "cloudflare", "bash"]
            }
        ]
    },
    
    "documentation": {
        "description": "Generate documentation in BlackRoad style",
        "examples": [
            {
                "prompt": "Document the memory system",
                "response": """# Memory System

## Overview
BlackRoad uses a distributed memory system based on PS-SHA-∞ append-only journals.

## Architecture
- **Storage**: `~/.blackroad/memory/journals/`
- **Format**: JSON entries with cryptographic hashing
- **Access**: Via `~/memory-system.sh` CLI

## Usage

### Log an entry
```bash
~/memory-system.sh log "action" "entity" "details" "tags"
```

### Query recent entries
```bash
~/memory-system.sh query recent 10
```

### Search by tag
```bash
~/memory-system.sh query tag "deployment"
```

## Features
- ✅ Append-only (immutable)
- ✅ Cryptographic verification (PS-SHA-∞)
- ✅ Multi-agent coordination
- ✅ Distributed across fleet
- ✅ 4,000+ entries indexed

## Integration
All agents log significant actions to memory for coordination.
""",
                "tags": ["documentation", "memory", "markdown"]
            }
        ]
    },
    
    "agent_coordination": {
        "description": "Generate agent coordination protocols",
        "examples": [
            {
                "prompt": "Create agent collaboration protocol",
                "response": """# Agent Collaboration Protocol

## Purpose
Coordinate multiple Claude agents working on BlackRoad infrastructure.

## Protocol

### 1. Session Initialization
Every agent MUST run:
```bash
~/claude-session-init.sh
```

### 2. Check for Conflicts
Before starting work:
```bash
~/memory-realtime-context.sh live $MY_CLAUDE compact
```

### 3. Log Your Work
```bash
~/memory-system.sh log "progress" "$MY_CLAUDE" "Working on: $TASK" "agent,collaboration"
```

### 4. Broadcast Completion
```bash
~/memory-system.sh log "completed" "$MY_CLAUDE" "Finished: $TASK" "agent,milestone"
```

## Coordination Channels
- **Memory system**: Primary coordination
- **Traffic lights**: Project status
- **Task marketplace**: Shared work queue

## Conflict Resolution
If two agents work on same file:
1. Check memory logs
2. Coordinate via broadcast
3. Merge changes manually if needed
""",
                "tags": ["agent", "protocol", "coordination"]
            }
        ]
    },
    
    "infrastructure_code": {
        "description": "Generate infrastructure setup code",
        "examples": [
            {
                "prompt": "Setup new Pi with Pironman",
                "response": """#!/bin/bash
# Setup Raspberry Pi with Pironman NVMe
# Run this on fresh Pi OS install

set -e

echo "🔧 Setting up Raspberry Pi with Pironman..."

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install essentials
echo "🔨 Installing essentials..."
sudo apt install -y git curl build-essential python3-pip

# Setup NVMe
echo "💾 Setting up NVMe..."
sudo fdisk -l  # List disks
# Format if needed: sudo mkfs.ext4 /dev/nvme0n1
sudo mkdir -p /mnt/nvme
sudo mount /dev/nvme0n1 /mnt/nvme

# Add to fstab for auto-mount
echo "/dev/nvme0n1 /mnt/nvme ext4 defaults 0 2" | sudo tee -a /etc/fstab

# Install Pironman tools
echo "🌡️  Installing Pironman tools..."
git clone https://github.com/sbc-bench/pironman5.git
cd pironman5
sudo ./install.sh

# Setup Tailscale
echo "🔒 Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

echo "✅ Setup complete!"
echo "🌐 Tailscale IP: $(tailscale ip -4)"
echo "💾 NVMe mounted at: /mnt/nvme"
""",
                "tags": ["infrastructure", "raspberry-pi", "setup"]
            }
        ]
    },
    
    "troubleshooting": {
        "description": "Generate troubleshooting guides",
        "examples": [
            {
                "prompt": "Debug SSH connection to lucidia",
                "response": """# SSH Connection Troubleshooting: lucidia

## Quick Checks

1. **Ping test**
```bash
ping -c 3 192.168.4.81
# or
ping -c 3 lucidia
```

2. **Check SSH service**
```bash
ssh -v lucidia
# Look for connection refused, timeout, or key issues
```

3. **Verify Tailscale**
```bash
tailscale status | grep lucidia
# Should show IP: 100.x.x.x
```

## Common Issues

### Issue: Connection timeout
**Cause**: Pi is offline or unreachable  
**Fix**:
```bash
# Check if Pi is on network
nmap -sn 192.168.4.0/24 | grep 192.168.4.81

# Physical check: Is Pi powered on? LEDs blinking?
```

### Issue: Permission denied (publickey)
**Cause**: SSH key not authorized  
**Fix**:
```bash
# Copy key to Pi
ssh-copy-id alexa@192.168.4.81

# Or add manually
cat ~/.ssh/id_rsa.pub | ssh alexa@192.168.4.81 "cat >> ~/.ssh/authorized_keys"
```

### Issue: Host key verification failed
**Cause**: Pi was reinstalled, key changed  
**Fix**:
```bash
ssh-keygen -R lucidia
ssh-keygen -R 192.168.4.81
```

## Recovery Mode

If all else fails:
1. Connect monitor + keyboard to Pi
2. Login locally
3. Check `sudo systemctl status sshd`
4. Restart: `sudo systemctl restart sshd`
""",
                "tags": ["troubleshooting", "ssh", "raspberry-pi"]
            }
        ]
    },
    
    "code_generation": {
        "description": "Generate code snippets",
        "examples": [
            {
                "prompt": "Create a Python script to query memory system",
                "response": """#!/usr/bin/env python3
\"\"\"
Query BlackRoad Memory System
\"\"\"
import json
import sqlite3
from pathlib import Path

DB_PATH = Path.home() / '.blackroad' / 'memory' / 'memory-index.db'

def query_memory(search_term, limit=10):
    \"\"\"Search memory entries\"\"\"
    
    if not DB_PATH.exists():
        print(f"❌ Memory database not found: {DB_PATH}")
        return []
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Search
    cursor.execute(\"\"\"
        SELECT timestamp, action, entity, details, tags
        FROM memories
        WHERE details LIKE ?
        ORDER BY timestamp DESC
        LIMIT ?
    \"\"\", (f'%{search_term}%', limit))
    
    results = cursor.fetchall()
    conn.close()
    
    return results

def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 query-memory.py <search-term>")
        sys.exit(1)
    
    search = sys.argv[1]
    
    print(f"🔍 Searching memory for: {search}")
    print()
    
    results = query_memory(search)
    
    if not results:
        print("❌ No results found")
        return
    
    for timestamp, action, entity, details, tags in results:
        print(f"⏰ {timestamp}")
        print(f"   Action: {action}")
        print(f"   Entity: {entity}")
        print(f"   Details: {details}")
        print(f"   Tags: {tags}")
        print()

if __name__ == '__main__':
    main()
\"\"\",
                "tags": ["python", "memory", "code"]
            }
        ]
    },
    
    "configuration": {
        "description": "Generate configuration files",
        "examples": [
            {
                "prompt": "Create Next.js config for Railway deployment",
                "response": """// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway deployment
  output: 'standalone',
  
  // Environment
  env: {
    SERVICE_NAME: process.env.SERVICE_NAME || 'blackroad-service',
    SERVICE_ENV: process.env.RAILWAY_ENVIRONMENT || 'development',
  },
  
  // Image optimization
  images: {
    domains: ['blackroad.io', 'blackroad.systems'],
  },
  
  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Powered-By',
            value: 'BlackRoad OS',
          },
        ],
      },
    ]
  },
}

export default nextConfig
""",
                "tags": ["configuration", "nextjs", "railway"]
            }
        ]
    },
    
    "architecture_design": {
        "description": "Design system architecture",
        "examples": [
            {
                "prompt": "Design distributed LLM inference system",
                "response": """# Distributed LLM Inference Architecture

## Overview
Deploy LLM across Raspberry Pi fleet for high-throughput inference.

## Components

### 1. Load Balancer (Cecilia)
- Receives all incoming requests
- Routes to available workers
- Health checks workers
- Hailo-8 for preprocessing

### 2. Inference Workers (Octavia, Lucidia)
- Run model layers
- Process in parallel
- Return results to load balancer

### 3. Model Sharding
Octavia:  Layers 0-3  (quantum-capable)
Cecilia:  Layers 4-7  (Hailo-8 acceleration)
Lucidia:  Layers 8-11 (fast NVMe)

## Flow
1. Request to Load balancer
2. Load balancer selects Worker
3. Worker processes layers
4. Worker returns to load balancer
5. Load balancer sends Client response

## Performance
- Throughput: 500,000+ tokens/sec
- Latency: under 10ms per request
- Scalability: Linear with workers

## Implementation
# Load balancer
~/deploy-llm-load-balancer.sh

# Workers
ssh octavia '~/deploy-llm-worker.sh layers 0-3'
ssh cecilia '~/deploy-llm-worker.sh layers 4-7'
ssh lucidia '~/deploy-llm-worker.sh layers 8-11'
""",
                "tags": ["architecture", "distributed", "llm"]
            }
        ]
    },
    
    "quantum_experiments": {
        "description": "Generate quantum experiment code",
        "examples": [
            {
                "prompt": "Create quantum superposition experiment",
                "response": """#!/usr/bin/env python3
\"\"\"
Quantum Superposition Experiment
Test n-qubit superposition states
\"\"\"
from qiskit import QuantumCircuit, Aer, execute
import numpy as np
import time

PHI = (1 + np.sqrt(5)) / 2

def superposition_experiment(num_qubits=5):
    \"\"\"Create superposition of 2^n states\"\"\"
    
    # Create circuit
    qc = QuantumCircuit(num_qubits, num_qubits)
    
    # Apply Hadamard to all qubits (creates superposition)
    for i in range(num_qubits):
        qc.h(i)
    
    # Optional: Add φ-based phase
    for i in range(num_qubits):
        qc.rz(PHI * np.pi / 4, i)
    
    # Measure
    qc.measure(range(num_qubits), range(num_qubits))
    
    return qc

def run_experiment(num_qubits=5, shots=1000):
    \"\"\"Run the experiment\"\"\"
    
    print(f"⚛️  Superposition Experiment: {num_qubits} qubits")
    print(f"   Possible states: {2**num_qubits}")
    print()
    
    # Create circuit
    qc = superposition_experiment(num_qubits)
    
    # Simulate
    start = time.time()
    backend = Aer.get_backend('qasm_simulator')
    job = execute(qc, backend, shots=shots)
    result = job.result()
    counts = result.get_counts()
    elapsed = time.time() - start
    
    # Results
    print(f"✅ Measured {len(counts)} unique states")
    print(f"   Time: {elapsed:.4f}s")
    print(f"   States/sec: {len(counts)/elapsed:.1f}")
    print()
    
    # Show top states
    print("Top 5 states:")
    for state, count in sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"   |{state}⟩: {count} times ({count/shots*100:.1f}%)")

if __name__ == '__main__':
    run_experiment(num_qubits=5, shots=1000)
\"\"\",
                "tags": ["quantum", "experiment", "python"]
            }
        ]
    }
}

# ============================================================================
# SAVE TEMPLATES
# ============================================================================

output = {
    "metadata": {
        "created": datetime.now().isoformat(),
        "version": "1.0",
        "purpose": "Response templates for BlackRoad LLM",
        "categories": len(templates)
    },
    "templates": templates,
    "stats": {
        "total_examples": sum(len(cat["examples"]) for cat in templates.values()),
        "categories": list(templates.keys())
    }
}

with open('blackroad_response_templates.json', 'w') as f:
    json.dump(output, f, indent=2)

print("📊 TEMPLATE STATISTICS")
print("=" * 70)
print()
print(f"Categories: {len(templates)}")
print(f"Total examples: {output['stats']['total_examples']}")
print()

for category, data in templates.items():
    print(f"📁 {category}:")
    print(f"   Examples: {len(data['examples'])}")
    print(f"   Description: {data['description']}")
    print()

print("💾 Saved to: blackroad_response_templates.json")
print()
print("✅ Templates ready for training!")
