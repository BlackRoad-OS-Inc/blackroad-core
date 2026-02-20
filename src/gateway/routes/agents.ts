// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'
import { GatewayError } from '../../protocol/errors.js'

const AGENTS = [
  { name: 'octavia', title: 'The Architect', role: 'Systems design', status: 'available' as const, providers: ['anthropic', 'openai'], capabilities: ['architecture', 'design', 'review'] },
  { name: 'lucidia', title: 'The Dreamer', role: 'Creative vision', status: 'available' as const, providers: ['anthropic', 'ollama'], capabilities: ['creative', 'vision', 'planning'] },
  { name: 'alice', title: 'The Operator', role: 'DevOps automation', status: 'available' as const, providers: ['ollama'], capabilities: ['devops', 'automation', 'infrastructure'] },
  { name: 'cipher', title: 'The Sentinel', role: 'Security', status: 'available' as const, providers: ['anthropic'], capabilities: ['security', 'encryption', 'audit'] },
  { name: 'prism', title: 'The Analyst', role: 'Data analysis', status: 'available' as const, providers: ['openai', 'ollama'], capabilities: ['analysis', 'patterns', 'data'] },
  { name: 'planner', title: 'The Strategist', role: 'Task planning', status: 'available' as const, providers: ['anthropic', 'openai', 'gemini'], capabilities: ['planning', 'decomposition', 'coordination'] },
]

export const agentRoutes = new Hono()

agentRoutes.get('/v1/agents', (c) => {
  return c.json({ agents: AGENTS })
})

agentRoutes.get('/v1/agents/:name', (c) => {
  const name = c.req.param('name')
  const agent = AGENTS.find((a) => a.name === name)
  if (!agent) {
    throw new GatewayError(`Agent not found: ${name}`, 'AGENT_NOT_FOUND', 404)
  }
  return c.json(agent)
})
