# blackroad-core

Core orchestration layer and tokenless gateway for BlackRoad OS.

## Architecture

```
Client (Web/CLI) → Gateway → Policy Engine → Provider (Anthropic/OpenAI/Ollama/Gemini)
```

Agents never hold API keys. All provider communication flows through this gateway.

## Quick Start

```bash
npm install
npm run dev          # Start dev server at localhost:8787
```

## Development

```bash
npm run typecheck    # Type check
npm run test         # Run tests
npm run lint         # Lint
npm run build        # Compile to dist/
```

## Project Structure

```
src/
├── gateway/         Server, middleware, routes
│   ├── middleware/   Rate limiter, auth, request logger
│   └── routes/      Health, chat, agents, invoke
├── providers/       AI provider adapters
├── policies/        Permission engine
├── protocol/        Zod schemas, error types
├── agents/          Agent registry and invoker
├── prompts/         System prompt loader and builder
└── telemetry/       Logger, metrics
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/health` | GET | Health check (no auth) |
| `/v1/chat/completions` | POST | Chat completion |
| `/v1/agents` | GET | List agents |
| `/v1/agents/:name` | GET | Get agent details |
| `/v1/invoke` | POST | Invoke an agent |

## License

Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
