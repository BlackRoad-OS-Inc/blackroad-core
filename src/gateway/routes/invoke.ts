// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'
import { InvokeRequestSchema } from '../../protocol/schemas.js'
import { ValidationError, GatewayError } from '../../protocol/errors.js'
import type { AgentInvoker } from '../../agents/invoker.js'
import type { AgentDefinition } from '../../agents/registry.js'

// Built-in agents with fallback chains
const BUILTIN_AGENTS: Record<string, AgentDefinition> = {
  octavia: { name: 'octavia', title: 'The Architect', role: 'architecture', providers: ['anthropic', 'openai'], capabilities: ['design', 'review'], fallbackChain: ['anthropic', 'openai'] },
  cece: { name: 'cece', title: 'CECE', role: 'assistant', providers: ['ollama'], capabilities: ['chat', 'local'], fallbackChain: ['ollama'] },
  lucidia: { name: 'lucidia', title: 'Lucidia', role: 'companion', providers: ['anthropic', 'ollama'], capabilities: ['chat', 'reasoning'], fallbackChain: ['anthropic', 'ollama'] },
  aria: { name: 'aria', title: 'Aria', role: 'ops', providers: ['openai', 'ollama'], capabilities: ['ops', 'monitoring'], fallbackChain: ['openai', 'ollama'] },
}

// Legacy export
export const invokeRoutes = new Hono()
invokeRoutes.post('/v1/invoke', async (c) => {
  return c.json({ error: 'Orchestration not configured. Use createInvokeRoutes(invoker).' }, 501)
})

// Factory that wires the invoker
export function createInvokeRoutes(invoker: AgentInvoker): Hono {
  const router = new Hono()

  router.post('/v1/invoke', async (c) => {
    const body = await c.req.json()
    const parsed = InvokeRequestSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        `Invalid request: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      )
    }

    const agentDef = BUILTIN_AGENTS[parsed.data.agent]
    if (!agentDef) {
      throw new GatewayError(`Agent not found: ${parsed.data.agent}`, 'AGENT_NOT_FOUND', 404)
    }

    const messages = [{ role: 'user' as const, content: parsed.data.task }]
    const response = await invoker.invoke(agentDef, messages)

    return c.json({
      id: response.id,
      agent: parsed.data.agent,
      result: response.content,
      model: response.model,
      provider: 'gateway',
      usage: response.usage,
    })
  })

  return router
}
