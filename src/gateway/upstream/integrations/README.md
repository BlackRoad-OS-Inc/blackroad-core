# Gateway Integrations for BlackRoad Websites

This directory contains integration configs for adding gateway access to each BlackRoad website.

## Quick Integration

Add to any Next.js site:

### 1. API Route: `/app/api/gateway/[...path]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const searchParams = request.nextUrl.searchParams
  
  const gatewayUrl = `${GATEWAY_URL}/api/${path}?${searchParams}`
  
  try {
    const response = await fetch(gatewayUrl)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Gateway unavailable' },
      { status: 503 }
    )
  }
}
```

### 2. Environment Variable

```bash
# .env.local
GATEWAY_URL=http://localhost:3030
# Or production: https://gateway.blackroad.io
```

### 3. Usage in Components

```typescript
// Fetch gateway stats
const response = await fetch('/api/gateway/stats')
const { stats } = await response.json()

// Check health
const health = await fetch('/api/gateway/health')
const { instances } = await health.json()

// List models
const models = await fetch('/api/gateway/models')
const { models: modelList } = await models.json()
```

## Deployment Options

### Option 1: Centralized Gateway (Railway)
- Deploy gateway once to Railway
- All sites connect to: `https://gateway.blackroad.io`
- Single source of truth
- Easy to monitor

### Option 2: Distributed Gateways (Pi Fleet)
- Each Pi runs gateway instance
- Sites connect to nearest Pi
- Low latency
- High availability

### Option 3: Hybrid
- Central gateway for web dashboard
- Local gateways for MCP/CLI
- Best of both worlds

## Sites Ready for Integration

### api.blackroad.io
- **Service**: blackroad-os-api
- **Description**: Public API gateway
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### brand.blackroad.io
- **Service**: blackroad-os-brand
- **Description**: Brand assets and guidelines portal
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### console.blackroad.io
- **Service**: blackroad-os-prism-console
- **Description**: Prism console interface
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### core.blackroad.io
- **Service**: blackroad-os-core
- **Description**: Core platform services
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### dashboard.blackroad.io
- **Service**: blackroad-os-operator
- **Description**: Operator dashboard (alias)
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### demo.blackroad.io
- **Service**: blackroad-os-demo
- **Description**: Demo and sandbox environment
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### docs.blackroad.io
- **Service**: blackroad-os-docs
- **Description**: Documentation portal
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### ideas.blackroad.io
- **Service**: blackroad-os-ideas
- **Description**: Ideas and innovation hub
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### infra.blackroad.io
- **Service**: blackroad-os-infra
- **Description**: Infrastructure management portal
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### operator.blackroad.io
- **Service**: blackroad-os-operator
- **Description**: Operator control panel
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### prism.blackroad.io
- **Service**: blackroad-os-prism-console
- **Description**: Prism console main interface
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### research.blackroad.io
- **Service**: blackroad-os-research
- **Description**: Research and development portal
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

### web.blackroad.io
- **Service**: blackroad-os-web
- **Description**: Main marketing and public-facing website
- **Integration**: Add `/app/api/gateway/[...path]/route.ts`

