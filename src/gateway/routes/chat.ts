// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'
import { ChatRequestSchema } from '../../protocol/schemas.js'
import { ValidationError } from '../../protocol/errors.js'

export const chatRoutes = new Hono()

chatRoutes.post('/v1/chat/completions', async (c) => {
  const body = await c.req.json()
  const parsed = ChatRequestSchema.safeParse(body)

  if (!parsed.success) {
    throw new ValidationError(
      `Invalid request: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    )
  }

  // In a full implementation, this would route through the provider registry.
  // For now, return a placeholder acknowledging the request.
  return c.json({
    id: `resp-${Date.now()}`,
    content: 'Gateway received request. Provider routing not yet connected.',
    model: parsed.data.model ?? 'default',
    provider: 'gateway',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  })
})
