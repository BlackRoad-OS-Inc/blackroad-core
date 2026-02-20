// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'
import { InvokeRequestSchema } from '../../protocol/schemas.js'
import { ValidationError } from '../../protocol/errors.js'

export const invokeRoutes = new Hono()

invokeRoutes.post('/v1/invoke', async (c) => {
  const body = await c.req.json()
  const parsed = InvokeRequestSchema.safeParse(body)

  if (!parsed.success) {
    throw new ValidationError(
      `Invalid request: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    )
  }

  return c.json({
    id: `inv-${Date.now()}`,
    agent: parsed.data.agent,
    result: `Agent ${parsed.data.agent} received task. Orchestration not yet connected.`,
    model: 'default',
    provider: 'gateway',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  })
})
