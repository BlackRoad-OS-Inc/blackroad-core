// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'
import type { GatewayConfig } from './config.js'
import { requestLogger } from './middleware/request-logger.js'
import { rateLimiter } from './middleware/rate-limiter.js'
import { healthRoutes, agentRoutes } from './routes/index.js'
import { createChatRoutes } from './routes/chat.js'
import { createInvokeRoutes } from './routes/invoke.js'
import { GatewayError } from '../protocol/errors.js'
import { createProviderRegistry } from '../providers/registry.js'
import { AnthropicProvider } from '../providers/anthropic.js'
import { OpenAIProvider } from '../providers/openai.js'
import { OllamaProvider } from '../providers/ollama.js'
import { GeminiProvider } from '../providers/gemini.js'
import { AgentInvoker } from '../agents/invoker.js'
import { logger } from '../telemetry/logger.js'

export function createGateway(_config: GatewayConfig): Hono {
  const app = new Hono()

  // Initialize provider registry
  const providers = createProviderRegistry()

  const anthCfg = _config.providers.anthropic
  if (anthCfg?.enabled && anthCfg.apiKey) {
    providers.register(new AnthropicProvider(anthCfg.baseUrl, anthCfg.apiKey))
    logger.info('Registered provider: anthropic')
  }

  const oaiCfg = _config.providers.openai
  if (oaiCfg?.enabled && oaiCfg.apiKey) {
    providers.register(new OpenAIProvider(oaiCfg.baseUrl, oaiCfg.apiKey))
    logger.info('Registered provider: openai')
  }

  const ollamaCfg = _config.providers.ollama
  if (ollamaCfg?.enabled) {
    providers.register(new OllamaProvider(ollamaCfg.baseUrl))
    logger.info('Registered provider: ollama')
  }

  const gemCfg = _config.providers.gemini
  if (gemCfg?.enabled && gemCfg.apiKey) {
    providers.register(new GeminiProvider(gemCfg.baseUrl, gemCfg.apiKey))
    logger.info('Registered provider: gemini')
  }

  const invoker = new AgentInvoker(providers)

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

  app.route('/', createChatRoutes(invoker))
  app.route('/', agentRoutes)
  app.route('/', createInvokeRoutes(invoker))

  return app
}
