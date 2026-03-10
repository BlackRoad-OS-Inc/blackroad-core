// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { describe, it, expect } from 'vitest'
import { createGateway } from '../../src/gateway/server.js'
import type { GatewayConfig } from '../../src/gateway/config.js'

const testConfig: GatewayConfig = {
  port: 8787,
  host: '127.0.0.1',
  logLevel: 'silent',
  rateLimit: { windowMs: 60000, maxRequests: 100 },
  providers: {
    ollama: { enabled: true, baseUrl: 'http://localhost:11434' },
  },
}

describe('Gateway Server', () => {
  it('should create a Hono app', () => {
    const app = createGateway(testConfig)
    expect(app).toBeDefined()
    expect(app.fetch).toBeDefined()
  })

  it('should respond to health check', async () => {
    const app = createGateway(testConfig)
    const res = await app.request('/v1/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('healthy')
    expect(body.version).toBe('0.1.0')
    expect(typeof body.uptime).toBe('number')
  })

  it('should list agents', async () => {
    const app = createGateway(testConfig)
    const res = await app.request('/v1/agents')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.agents).toBeInstanceOf(Array)
    expect(body.agents.length).toBe(6)
  })

  it('should get a specific agent', async () => {
    const app = createGateway(testConfig)
    const res = await app.request('/v1/agents/octavia')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('octavia')
    expect(body.title).toBe('The Architect')
  })

  it('should return 404 for unknown agent', async () => {
    const app = createGateway(testConfig)
    const res = await app.request('/v1/agents/nonexistent')
    expect(res.status).toBe(404)
  })
})
