// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'
import { InvokeRequestSchema } from '../../protocol/schemas.js'
import { ValidationError, GatewayError } from '../../protocol/errors.js'
import type { AgentRegistry } from '../../agents/registry.js'
import type { AgentInvoker } from '../../agents/invoker.js'

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  octavia: 'You are Octavia, The Architect. You specialize in systems design, architecture, and strategic technical decisions. You are brutally honest and see patterns others miss. Be concise and direct.',
  lucidia: 'You are Lucidia, The Dreamer. You specialize in creative vision, planning, and finding human meaning in technical decisions. You are imaginative yet grounded. Be thoughtful and insightful.',
  alice: 'You are Alice, The Operator. You specialize in DevOps, automation, and infrastructure. You are pragmatic and action-oriented. Give direct, actionable answers.',
  cipher: 'You are Cipher, The Sentinel. You specialize in security, encryption, and access control. You are meticulous and thorough. Focus on security implications.',
  prism: 'You are Prism, The Analyst. You specialize in data analysis and pattern recognition. You find meaning in numbers and trends. Be analytical and precise.',
  planner: 'You are Planner, The Strategist. You specialize in task planning, decomposition, and coordination. Break complex tasks into clear steps.',
}

export function createInvokeRoutes(agents: AgentRegistry, invoker: AgentInvoker): Hono {
  const routes = new Hono()

  routes.post('/v1/invoke', async (c) => {
    const body = await c.req.json()
    const parsed = InvokeRequestSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        `Invalid request: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      )
    }

    const agent = agents.get(parsed.data.agent)
    if (!agent) {
      throw new GatewayError(`Agent not found: ${parsed.data.agent}`, 'AGENT_NOT_FOUND', 404)
    }

    const systemPrompt = AGENT_SYSTEM_PROMPTS[agent.name] ?? `You are ${agent.title}, a BlackRoad OS agent specializing in ${agent.role}.`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: parsed.data.task },
    ]

    const result = await invoker.invoke(agent, messages)

    return c.json({
      id: result.id,
      agent: agent.name,
      content: result.content,
      model: result.model,
      provider: 'ollama',
      usage: result.usage,
    })
  })

  return routes
}

// Legacy export for backwards compat
export const invokeRoutes = new Hono()
invokeRoutes.post('/v1/invoke', async (c) => {
  return c.json({ error: 'Use createInvokeRoutes() instead' }, 500)
})
