// Adaptive Router
// Uses performance learning to make smarter routing decisions

import { PerformanceLearner } from './performance-learner.js'

export class AdaptiveRouter {
  constructor(routeEngine) {
    this.routeEngine = routeEngine
    this.learner = new PerformanceLearner()
    this.adaptiveMode = true
    this.initialized = false
  }

  async initialize() {
    await this.learner.initialize()
    this.initialized = true
  }

  async route(intent, prompt, options = {}) {
    if (!this.initialized) await this.initialize()

    const startTime = Date.now()
    
    try {
      let models = options.models || []
      
      if (this.adaptiveMode && models.length > 0) {
        models = this.reorderByPerformance(intent, models)
      }

      const result = await this.routeEngine.route(intent, prompt, {
        ...options,
        models
      })

      const latency = Date.now() - startTime
      await this.learner.recordRequest(intent, result.model, true, latency, {
        provider: result.provider,
        instance: result.instance
      })

      return result
    } catch (error) {
      const latency = Date.now() - startTime
      const attemptedModel = options.models?.[0] || 'unknown'
      await this.learner.recordRequest(intent, attemptedModel, false, latency, {
        error: error.message
      })

      throw error
    }
  }

  reorderByPerformance(intent, models) {
    const scored = models.map(model => ({
      model,
      score: this.learner.getPerformanceScore(intent, model)
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored.map(s => s.model)
  }

  getBestModel(intent) {
    return this.learner.getBestModelForIntent(intent)
  }

  getRecommendations(intent, count = 3) {
    return this.learner.getRecommendedModels(intent, count)
  }

  getStats() {
    return {
      adaptiveMode: this.adaptiveMode,
      learning: this.learner.getStats()
    }
  }

  enableAdaptiveMode() {
    this.adaptiveMode = true
  }

  disableAdaptiveMode() {
    this.adaptiveMode = false
  }
}
