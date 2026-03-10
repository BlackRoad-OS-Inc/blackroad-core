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
import { AgentRegistry } from '../agents/registry.js'
import { AgentInvoker } from '../agents/invoker.js'
import { logger } from '../telemetry/logger.js'

export function createGateway(config: GatewayConfig): Hono {
  const app = new Hono()

  // Initialize provider registry
  const providers = createProviderRegistry()

  const anthCfg = config.providers.anthropic
  if (anthCfg?.enabled && anthCfg.apiKey) {
    providers.register(new AnthropicProvider(anthCfg.baseUrl, anthCfg.apiKey))
    logger.info('Registered provider: anthropic')
  }

  const oaiCfg = config.providers.openai
  if (oaiCfg?.enabled && oaiCfg.apiKey) {
    providers.register(new OpenAIProvider(oaiCfg.baseUrl, oaiCfg.apiKey))
    logger.info('Registered provider: openai')
  }

  const ollamaCfg = config.providers.ollama
  if (ollamaCfg?.enabled) {
    providers.register(new OllamaProvider(ollamaCfg.baseUrl))
    logger.info('Registered provider: ollama')
  }

  const gemCfg = config.providers.gemini
  if (gemCfg?.enabled && gemCfg.apiKey) {
    providers.register(new GeminiProvider(gemCfg.baseUrl, gemCfg.apiKey))
    logger.info('Registered provider: gemini')
  }

  // Initialize agents
  const agents = new AgentRegistry()
  agents.register({ name: 'octavia', title: 'The Architect', role: 'Systems design', providers: ['ollama'], capabilities: ['architecture', 'design', 'review', 'strategy'], fallbackChain: ['ollama'] })
  agents.register({ name: 'lucidia', title: 'The Dreamer', role: 'Creative vision', providers: ['ollama'], capabilities: ['creative', 'vision', 'planning', 'ideation'], fallbackChain: ['ollama'] })
  agents.register({ name: 'alice', title: 'The Operator', role: 'DevOps automation', providers: ['ollama'], capabilities: ['devops', 'automation', 'infrastructure', 'deployment'], fallbackChain: ['ollama'] })
  agents.register({ name: 'cipher', title: 'The Sentinel', role: 'Security', providers: ['ollama'], capabilities: ['security', 'encryption', 'audit', 'access-control'], fallbackChain: ['ollama'] })
  agents.register({ name: 'prism', title: 'The Analyst', role: 'Data analysis', providers: ['ollama'], capabilities: ['analysis', 'patterns', 'data', 'reporting'], fallbackChain: ['ollama'] })
  agents.register({ name: 'planner', title: 'The Strategist', role: 'Task planning', providers: ['ollama'], capabilities: ['planning', 'decomposition', 'coordination', 'delegation'], fallbackChain: ['ollama'] })

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
  app.use('/v1/chat/*', rateLimiter({ windowMs: config.rateLimit.windowMs, maxRequests: config.rateLimit.maxRequests }))
  app.use('/v1/invoke', rateLimiter({ windowMs: config.rateLimit.windowMs, maxRequests: config.rateLimit.maxRequests }))
  app.use('/v1/agents/*', rateLimiter({ windowMs: config.rateLimit.windowMs, maxRequests: config.rateLimit.maxRequests }))

  app.route('/', createChatRoutes(invoker))
  app.route('/', agentRoutes)
  app.route('/', createInvokeRoutes(invoker))

  return app
}
