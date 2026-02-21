# BlackRoad Copilot Agent Gateway

Intelligent routing gateway that routes GitHub Copilot CLI requests to optimal local AI agents running on BlackRoad infrastructure.

## 🎯 What It Does

- **Classifies** incoming requests by intent (code generation, analysis, debugging, etc.)
- **Routes** to the best available local AI model (qwen, deepseek, llama3, mistral, codellama)
- **Tracks** performance and learns which models work best for which tasks
- **Integrates** seamlessly with GitHub Copilot CLI via MCP protocol

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Start Gateway
```bash
# Default (Octavia endpoint)
npm start

# Custom Ollama endpoint
OLLAMA_ENDPOINT=http://localhost:11434 npm start
```

### Configure Copilot CLI
Add to `~/.copilot/mcp-config.json`:
```json
{
  "mcpServers": {
    "blackroad-gateway": {
      "command": "node",
      "args": ["/path/to/copilot-agent-gateway/server.js"]
    }
  }
}
```

Then in Copilot CLI:
```bash
copilot
> /mcp
```

## 📦 Available Tools

- **route_request** - Route request to optimal AI agent
- **list_models** - List all available models
- **model_status** - Check model health
- **gateway_stats** - View gateway statistics

## 🤖 Supported Models

| Model | Best For |
|-------|----------|
| qwen2.5-coder:7b | Code analysis, refactoring, templates |
| deepseek-coder:6.7b | Code generation, new features |
| llama3:8b | Documentation, planning, explanations |
| mistral:7b | Fast reasoning, quick tasks |
| codellama:7b | Code review, understanding |

## 🔧 Configuration

### Model Registry
Edit `models/registry.json` to add/remove models or adjust capabilities.

### Routing Rules
Edit `config/routing-rules.json` to customize intent classification keywords.

### Ollama Endpoint
Set `OLLAMA_ENDPOINT` environment variable (default: `http://octavia:11434`)

## 📊 Logging

Routing history is logged to:
- `~/.blackroad/copilot-gateway/routing-history.jsonl`
- PS-SHA-∞ memory system (future)

## 🏗️ Architecture

```
GitHub Copilot CLI
        ↓
MCP Server (stdio)
        ↓
Request Classifier (keyword-based)
        ↓
Router (selects optimal model)
        ↓
Ollama API (local fleet)
        ↓
Response to Copilot
```

## 🔍 Example Routing

- "Create a new React component" → **deepseek-coder:6.7b** (code_generation)
- "Refactor this function" → **qwen2.5-coder:7b** (code_refactoring)
- "Explain this algorithm" → **llama3:8b** (documentation)
- "Debug this error" → **deepseek-coder:6.7b** (debugging)
- "Write tests" → **qwen2.5-coder:7b** (testing)

## 📈 Performance

- Classification: <10ms
- Routing overhead: <50ms
- Total latency: Depends on model + request complexity

## 🛠️ Development

```bash
# Watch mode
npm run dev

# Test locally
node server.js
```

## 📝 License

Proprietary - See `../BLACKROAD_PROPRIETARY_LICENSE.md`

## 🌌 BlackRoad OS

Part of the BlackRoad OS distributed AI infrastructure.
