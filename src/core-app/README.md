# BlackRoad Web Service Template

Universal Next.js 14 template for BlackRoad infrastructure services. This template provides a production-ready foundation for deploying web services to Cloudflare Pages or Railway.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Health check endpoints** (`/api/health`, `/api/version`, `/api/ready`)
- **Railway-ready** with `railway.json` configuration
- **Docker support** with multi-stage builds
- **Standalone output** for optimal performance
- **Environment variable** management

## Quick Start

### 1. Local Development

```bash
# Copy environment variables
cp .env.example .env

# Edit .env and set your service name
# SERVICE_NAME=your-service-name
# NEXT_PUBLIC_APP_NAME=Your Service Name

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see your service running.

### 2. Build for Production

```bash
npm run build
npm start
```

### 3. Type Checking

```bash
npm run type-check
```

## API Endpoints

All services include these standard endpoints:

- **`GET /api/health`** - Health check endpoint
  - Returns: `{ status: "ok", service: "...", timestamp: "...", uptime: ... }`

- **`GET /api/version`** - Version information
  - Returns: `{ version: "...", service: "...", environment: "...", node_version: "...", build_time: "..." }`

- **`GET /api/ready`** - Readiness probe for orchestration
  - Returns: `{ ready: true, service: "..." }`

## Deployment

### Deploy to Railway

1. **Create a new Railway project** or use an existing one
2. **Connect your repository** to Railway
3. **Set environment variables** in Railway dashboard:
   ```
   SERVICE_NAME=your-service-name
   SERVICE_ENV=production
   NEXT_PUBLIC_APP_NAME=Your Service Name
   NEXT_PUBLIC_BASE_URL=https://your-service.railway.app
   ```
4. **Railway will automatically**:
   - Detect the `railway.json` configuration
   - Build using Nixpacks
   - Run health checks on `/api/health`
   - Deploy your service

### Deploy to Cloudflare Pages

1. **Connect your repository** to Cloudflare Pages
2. **Build settings**:
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Root directory: (leave default or specify your service directory)
3. **Environment variables**:
   ```
   SERVICE_NAME=your-service-name
   SERVICE_ENV=production
   NEXT_PUBLIC_APP_NAME=Your Service Name
   ```

### Docker Deployment

```bash
# Build the image
docker build -t blackroad-service \
  --build-arg SERVICE_NAME=your-service \
  --build-arg SERVICE_ENV=production \
  .

# Run the container
docker run -p 3000:3000 \
  -e SERVICE_NAME=your-service \
  -e SERVICE_ENV=production \
  blackroad-service
```

## Cloudflare + Railway Wiring

To connect a subdomain to your Railway deployment:

1. **Get your Railway service URL** (e.g., `your-service-production.up.railway.app`)

2. **In Cloudflare DNS**, add a CNAME record:
   - **Type**: CNAME
   - **Name**: your-subdomain (e.g., `api`, `web`, `prism`)
   - **Target**: your-service-production.up.railway.app
   - **Proxy status**: Proxied (orange cloud)

3. **Optional**: Set `NEXT_PUBLIC_BASE_URL` in Railway to your custom domain:
   ```
   NEXT_PUBLIC_BASE_URL=https://your-subdomain.blackroad.systems
   ```

4. **Verify** by visiting `https://your-subdomain.blackroad.systems/api/health`

## Customization

### For a New Service

1. **Copy this template** to your service directory:
   ```bash
   cp -r templates/web-service services/your-service
   cd services/your-service
   ```

2. **Update `package.json`**:
   ```json
   {
     "name": "blackroad-your-service",
     ...
   }
   ```

3. **Update `.env`**:
   ```env
   SERVICE_NAME=blackroad-your-service
   NEXT_PUBLIC_APP_NAME=Your Service Name
   ```

4. **Customize `app/page.tsx`** with your service-specific content

5. **Add your routes** in `app/` directory

### Adding Custom API Routes

Create new route handlers in `app/api/`:

```typescript
// app/api/custom/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Custom endpoint' })
}
```

### Adding Pages

Create new pages in `app/`:

```typescript
// app/about/page.tsx
export default function About() {
  return <main>About page content</main>
}
```

## Architecture

```
templates/web-service/
├── app/
│   ├── api/
│   │   ├── health/route.ts      # Health check
│   │   ├── version/route.ts     # Version info
│   │   └── ready/route.ts       # Readiness probe
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage
├── Dockerfile                   # Multi-stage Docker build
├── railway.json                 # Railway configuration
├── next.config.mjs              # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SERVICE_NAME` | Unique service identifier | Yes | `blackroad-service` |
| `SERVICE_ENV` | Environment (development/production) | Yes | `development` |
| `SERVICE_VERSION` | Service version | No | `0.0.1` |
| `NEXT_PUBLIC_APP_NAME` | Display name | Yes | `BlackRoad Service` |
| `NEXT_PUBLIC_BASE_URL` | Base URL for the service | No | `http://localhost:3000` |
| `BUILD_TIME` | Build timestamp (auto-set) | No | Current timestamp |

## Railway Configuration

The `railway.json` file configures:

- **Builder**: Nixpacks (automatic detection)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check**: `/api/health` endpoint
- **Restart Policy**: Restart on failure (max 10 retries)

## Support

For issues or questions:
- Check the [BlackRoad registry](../../infra/blackroad_registry.json) for service mappings
- Review Railway/Cloudflare deployment logs
- Verify environment variables are set correctly

---

**BlackRoad Infrastructure** · Template v1.0.0
