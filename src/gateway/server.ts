// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'
import type { GatewayConfig } from './config.js'
import { requestLogger } from './middleware/request-logger.js'
import { rateLimiter } from './middleware/rate-limiter.js'
import { healthRoutes, chatRoutes, agentRoutes, invokeRoutes } from './routes/index.js'
import { GatewayError } from '../protocol/errors.js'

export function createGateway(_config: GatewayConfig): Hono {
  const app = new Hono()

  app.use('*', requestLogger())

  app.onError((err, c) => {
    if (err instanceof GatewayError) {
      return c.json(err.toJSON(), err.status as 400)
    }
    return c.json(
      { error: { code: 'GATEWAY_INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      500,
    )
  })

  // Health check — no auth required
  app.route('/', healthRoutes)

  // Protected routes
  app.use('/v1/chat/*', rateLimiter({ windowMs: _config.rateLimit.windowMs, maxRequests: _config.rateLimit.maxRequests }))
  app.use('/v1/invoke', rateLimiter({ windowMs: _config.rateLimit.windowMs, maxRequests: _config.rateLimit.maxRequests }))
  app.use('/v1/agents/*', rateLimiter({ windowMs: _config.rateLimit.windowMs, maxRequests: _config.rateLimit.maxRequests }))

  app.route('/', chatRoutes)
  app.route('/', agentRoutes)
  app.route('/', invokeRoutes)

  return app
}
