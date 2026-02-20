// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { serve } from '@hono/node-server'
import { createGateway } from './gateway/server.js'
import { loadConfig } from './gateway/config.js'
import { logger } from './telemetry/logger.js'

const config = loadConfig()
const app = createGateway(config)

serve({ fetch: app.fetch, port: config.port }, (info) => {
  logger.info({ port: info.port }, 'BlackRoad Gateway started')
})
