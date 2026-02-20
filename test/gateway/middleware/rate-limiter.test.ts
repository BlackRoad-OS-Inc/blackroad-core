// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { rateLimiter } from '../../../src/gateway/middleware/rate-limiter.js'

describe('Rate Limiter', () => {
  it('should allow requests within limit', async () => {
    const app = new Hono()
    app.use('*', rateLimiter({ windowMs: 60000, maxRequests: 10 }))
    app.get('/test', (c) => c.text('ok'))

    const res = await app.request('/test')
    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
  })

  it('should include remaining count header', async () => {
    const app = new Hono()
    app.use('*', rateLimiter({ windowMs: 60000, maxRequests: 5 }))
    app.get('/test', (c) => c.text('ok'))

    const res = await app.request('/test')
    expect(res.status).toBe(200)
    const remaining = parseInt(res.headers.get('X-RateLimit-Remaining') ?? '0', 10)
    expect(remaining).toBe(4)
  })

  it('should reject when limit exceeded', async () => {
    const app = new Hono()
    app.use('*', rateLimiter({ windowMs: 60000, maxRequests: 2 }))
    app.get('/test', (c) => c.text('ok'))
    app.onError((err, c) => {
      if ('status' in err) {
        return c.json({ error: (err as { message: string }).message }, (err as { status: number }).status as 429)
      }
      return c.json({ error: 'unknown' }, 500)
    })

    await app.request('/test', { headers: { authorization: 'Bearer test-limit' } })
    await app.request('/test', { headers: { authorization: 'Bearer test-limit' } })
    const res = await app.request('/test', { headers: { authorization: 'Bearer test-limit' } })
    expect(res.status).toBe(429)
  })
})
