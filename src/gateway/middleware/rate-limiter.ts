// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { MiddlewareHandler } from 'hono'
import { GatewayError } from '../../protocol/errors.js'

interface TokenBucket {
  tokens: number
  lastRefill: number
}

export function rateLimiter(opts: {
  windowMs: number
  maxRequests: number
}): MiddlewareHandler {
  const buckets = new Map<string, TokenBucket>()

  return async (c, next) => {
    const key = c.req.header('authorization') ?? c.req.header('x-forwarded-for') ?? 'anonymous'
    const now = Date.now()

    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { tokens: opts.maxRequests, lastRefill: now }
      buckets.set(key, bucket)
    }

    const elapsed = now - bucket.lastRefill
    const refill = Math.floor((elapsed / opts.windowMs) * opts.maxRequests)
    if (refill > 0) {
      bucket.tokens = Math.min(opts.maxRequests, bucket.tokens + refill)
      bucket.lastRefill = now
    }

    if (bucket.tokens <= 0) {
      throw new GatewayError('Rate limit exceeded', 'GATEWAY_RATE_LIMITED', 429)
    }

    bucket.tokens--

    c.header('X-RateLimit-Limit', String(opts.maxRequests))
    c.header('X-RateLimit-Remaining', String(bucket.tokens))
    c.header('X-RateLimit-Reset', String(Math.ceil((bucket.lastRefill + opts.windowMs) / 1000)))

    await next()
  }
}
