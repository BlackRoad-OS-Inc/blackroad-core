// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'
import { ChatRequestSchema } from '../../protocol/schemas.js'
import { ValidationError } from '../../protocol/errors.js'
import type { ProviderRegistry } from '../../providers/registry.js'

export function createChatRoutes(providers: ProviderRegistry): Hono {
  const routes = new Hono()

  routes.post('/v1/chat/completions', async (c) => {
    const body = await c.req.json()
    const parsed = ChatRequestSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        `Invalid request: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      )
    }

    const model = parsed.data.model ?? 'llama3.2:3b'

    // Route through Ollama provider
    const ollama = providers.get('ollama')
    if (!ollama) {
      throw new ValidationError('No provider available')
    }

    const result = await ollama.chat({
      model,
      messages: parsed.data.messages,
      temperature: parsed.data.temperature,
      maxTokens: parsed.data.max_tokens,
    })

    return c.json({
      id: result.id,
      content: result.content,
      model: result.model,
      provider: 'ollama',
      usage: result.usage,
    })
  })

  return routes
}

// Legacy export for backwards compat
export const chatRoutes = new Hono()
chatRoutes.post('/v1/chat/completions', async (c) => {
  return c.json({ error: 'Use createChatRoutes() instead' }, 500)
})
