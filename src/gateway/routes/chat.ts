// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'
import { ChatRequestSchema } from '../../protocol/schemas.js'
import { ValidationError } from '../../protocol/errors.js'
import type { AgentInvoker } from '../../agents/invoker.js'
import type { AgentDefinition } from '../../agents/registry.js'

// Default agent used for direct /v1/chat/completions calls
const DEFAULT_AGENT: AgentDefinition = {
  name: 'gateway',
  title: 'Gateway Direct',
  role: 'chat',
  providers: ['anthropic', 'openai', 'ollama'],
  capabilities: ['chat'],
  fallbackChain: ['anthropic', 'openai', 'ollama'],
}

// Legacy export for backwards compatibility
export const chatRoutes = new Hono()
chatRoutes.post('/v1/chat/completions', async (c) => {
  return c.json({ error: 'Provider not configured. Use createChatRoutes(invoker).' }, 501)
})

// Factory that wires the invoker
export function createChatRoutes(invoker: AgentInvoker): Hono {
  const router = new Hono()

  router.post('/v1/chat/completions', async (c) => {
    const body = await c.req.json()
    const parsed = ChatRequestSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        `Invalid request: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      )
    }

    const response = await invoker.invoke(DEFAULT_AGENT, parsed.data.messages, parsed.data.max_tokens)

    return c.json({
      id: response.id,
      content: response.content,
      model: response.model,
      provider: 'gateway',
      usage: response.usage,
    })
  })

  return router
}
