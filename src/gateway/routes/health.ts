// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'

const startTime = Date.now()

export const healthRoutes = new Hono()

healthRoutes.get('/v1/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  })
})
