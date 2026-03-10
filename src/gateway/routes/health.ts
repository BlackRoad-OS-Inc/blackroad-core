// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { Hono } from 'hono'

const startTime = Date.now()

export const healthRoutes = new Hono()

healthRoutes.get('/v1/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  })
})

healthRoutes.get('/v1/models', async (c) => {
  // Query all Ollama nodes for available models
  const fleet = process.env.BLACKROAD_OLLAMA_FLEET
  const nodes = fleet
    ? fleet.split(',').map((e) => { const [n, u] = e.split('='); return { name: n.trim(), url: u.trim() } })
    : [{ name: 'local', url: process.env.BLACKROAD_OLLAMA_URL ?? 'http://localhost:11434' }]

  const results = await Promise.all(
    nodes.map(async (node) => {
      try {
        const r = await fetch(`${node.url}/api/tags`, { signal: AbortSignal.timeout(3000) })
        if (!r.ok) return { node: node.name, status: 'down', models: [] }
        const d = (await r.json()) as { models: { name: string; size: number }[] }
        return { node: node.name, status: 'up', models: d.models.map((m) => m.name) }
      } catch {
        return { node: node.name, status: 'down', models: [] }
      }
    }),
  )

  return c.json({ nodes: results })
})
