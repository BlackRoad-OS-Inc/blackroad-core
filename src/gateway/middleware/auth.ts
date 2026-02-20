// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { MiddlewareHandler } from 'hono'
import { GatewayError } from '../../protocol/errors.js'

export function auth(): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new GatewayError(
        'Missing or invalid authorization token',
        'GATEWAY_AUTH_FAILED',
        401,
      )
    }

    const token = authHeader.slice(7)
    c.set('agentToken', token)
    c.set('agentId', token.split('-')[0] ?? 'unknown')

    await next()
  }
}
