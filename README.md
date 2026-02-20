# blackroad-core

Core orchestration layer and runtime engine for BlackRoad OS.

## Quick Start

```bash
npm install
npm run dev     # Development (auto-reload)
npm start       # Production
npm test        # Run tests
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Runtime metrics |
| GET | `/v1/agents` | Agent roster |
| POST | `/v1/agent` | Agent invocation |

## Deployment

Deploys to Railway on push to `main`. See `railway.toml` for config.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |

## License

Proprietary - BlackRoad OS, Inc. All rights reserved.
