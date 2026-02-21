#!/usr/bin/env node
// BlackRoad Copilot Gateway - Web Dashboard
import express from 'express'
import { readFile } from 'fs/promises'
import { RouteEngine } from './layers/route-engine.js'
import { RequestClassifier } from './classifier.js'
import { AdaptiveRouter } from './learning/adaptive-router.js'

const app = express()
const port = process.env.PORT || 3030

// Initialize components
const classifier = new RequestClassifier()
const routeEngine = new RouteEngine()
const adaptiveRouter = new AdaptiveRouter(routeEngine)

await classifier.load()
await routeEngine.initialize()
await adaptiveRouter.initialize()

console.log('🤖 Adaptive learning enabled!')

// Serve static HTML dashboard
app.get('/', async (req, res) => {
  const html = await readFile('./web/dashboard.html', 'utf-8')
  res.send(html)
})

// API: Health check all instances
app.get('/api/health', async (req, res) => {
  const health = await routeEngine.healthCheck()
  res.json({ success: true, instances: health })
})

// API: Gateway statistics
app.get('/api/stats', async (req, res) => {
  const stats = routeEngine.getStats()
  res.json({ success: true, stats })
})

// API: List models
app.get('/api/models', async (req, res) => {
  const models = routeEngine.registry.models.map(m => ({
    name: m.name,
    provider: m.provider,
    capabilities: m.capabilities,
    priority: m.priority,
    description: m.description
  }))
  res.json({ success: true, models })
})

// API: Recent routing decisions
app.get('/api/routing-history', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const history = routeEngine.routingHistory.slice(-limit)
  res.json({ success: true, history })
})

// API: Test route (for testing without Copilot CLI)
app.post('/api/test-route', express.json(), async (req, res) => {
  try {
    const { prompt, intent } = req.body
    
    // Classify or use provided intent
    let classification
    if (intent) {
      const intentRule = classifier.rules.intents[intent]
      classification = {
        intent,
        confidence: 1.0,
        models: intentRule.models,
        description: intentRule.description
      }
    } else {
      classification = classifier.classify(prompt)
    }

    // Route through adaptive router (learns from performance)
    const result = await adaptiveRouter.route(
      classification.intent,
      prompt,
      { models: classification.models }
    )

    res.json({
      success: true,
      routing: {
        intent: classification.intent,
        confidence: classification.confidence,
        model: result.model,
        provider: result.provider,
        instance: result.instance,
        latency: result.latency,
        load: result.load
      },
      response: result.response
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// API: Learning statistics
app.get('/api/learning/stats', async (req, res) => {
  const stats = adaptiveRouter.getStats()
  res.json({ success: true, stats })
})

// API: Get recommendations for an intent
app.get('/api/learning/recommendations/:intent', async (req, res) => {
  const { intent } = req.params
  const count = parseInt(req.query.count) || 3
  const recommendations = adaptiveRouter.getRecommendations(intent, count)
  res.json({ success: true, intent, recommendations })
})

// API: Get best model for an intent
app.get('/api/learning/best/:intent', async (req, res) => {
  const { intent } = req.params
  const bestModel = adaptiveRouter.getBestModel(intent)
  res.json({ success: true, intent, bestModel })
})

// API: Toggle adaptive mode
app.post('/api/learning/adaptive/:mode', async (req, res) => {
  const { mode } = req.params
  
  if (mode === 'on') {
    adaptiveRouter.enableAdaptiveMode()
  } else if (mode === 'off') {
    adaptiveRouter.disableAdaptiveMode()
  } else {
    return res.status(400).json({
      success: false,
      error: 'Mode must be "on" or "off"'
    })
  }
  
  res.json({
    success: true,
    adaptiveMode: adaptiveRouter.adaptiveMode
  })
})

// BlackRoad OS Unified Banner
const BLACKROAD_BANNER = `
═══════════════════════════════════════════════════════════════
  YOU ARE RUNNING UNDER BLACKROAD OS

  Unified AI Gateway - All providers route through BlackRoad:
  • Claude  → ~/.claude/CLAUDE.md
  • Codex   → ~/.codex/AGENTS.md
  • Copilot → ~/.copilot/agents/BLACKROAD.md
  • Ollama  → http://localhost:11434

  BlackRoad orchestrates. AI executes.
═══════════════════════════════════════════════════════════════
`

app.listen(port, () => {
  console.log(BLACKROAD_BANNER)
  console.log(`🌐 BlackRoad Unified AI Gateway`)
  console.log(`📊 Dashboard: http://localhost:${port}`)
  console.log(`🤖 AI endpoint: ${process.env.BLACKROAD_AI_ENDPOINT || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'}`)
  console.log(`🗺️  Multi-provider routing active (Claude, Codex, Copilot, Ollama)`)
})
