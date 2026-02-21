// Performance Learning System
// Tracks model performance and learns from routing decisions

import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class PerformanceLearner {
  constructor(dataFile = null) {
    this.dataFile = dataFile || join(__dirname, '../data/performance-history.json')
    this.metricsFile = join(__dirname, '../data/performance-metrics.json')
    this.history = []
    this.metrics = {}
    this.initialized = false
  }

  async initialize() {
    // Ensure data directory exists
    const dataDir = dirname(this.dataFile)
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    this.history = await this.loadHistory()
    this.metrics = await this.loadMetrics()
    this.initialized = true
  }

  async loadHistory() {
    try {
      if (existsSync(this.dataFile)) {
        const data = await readFile(this.dataFile, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load performance history:', error)
    }
    return []
  }

  async loadMetrics() {
    try {
      if (existsSync(this.metricsFile)) {
        const data = await readFile(this.metricsFile, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
    return {}
  }

  async saveHistory() {
    try {
      await writeFile(this.dataFile, JSON.stringify(this.history, null, 2))
    } catch (error) {
      console.error('Failed to save history:', error)
    }
  }

  async saveMetrics() {
    try {
      await writeFile(this.metricsFile, JSON.stringify(this.metrics, null, 2))
    } catch (error) {
      console.error('Failed to save metrics:', error)
    }
  }

  async recordRequest(intent, model, success, latency, details = {}) {
    if (!this.initialized) await this.initialize()

    const record = {
      timestamp: new Date().toISOString(),
      intent,
      model,
      success,
      latency,
      ...details
    }

    this.history.push(record)

    // Keep only last 1000 records
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000)
    }

    await this.saveHistory()
    await this.updateMetrics(intent, model, success, latency)
  }

  async updateMetrics(intent, model, success, latency) {
    const key = `${intent}:${model}`
    
    if (!this.metrics[key]) {
      this.metrics[key] = {
        intent,
        model,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalLatency: 0,
        avgLatency: 0,
        minLatency: Infinity,
        maxLatency: 0,
        successRate: 0,
        lastUsed: null
      }
    }

    const m = this.metrics[key]
    m.totalRequests++
    
    if (success) {
      m.successfulRequests++
    } else {
      m.failedRequests++
    }

    m.totalLatency += latency
    m.avgLatency = m.totalLatency / m.totalRequests
    m.minLatency = Math.min(m.minLatency, latency)
    m.maxLatency = Math.max(m.maxLatency, latency)
    m.successRate = m.successfulRequests / m.totalRequests
    m.lastUsed = new Date().toISOString()

    await this.saveMetrics()
  }

  getMetricsForIntent(intent) {
    return Object.values(this.metrics)
      .filter(m => m.intent === intent)
      .sort((a, b) => {
        if (Math.abs(a.successRate - b.successRate) > 0.1) {
          return b.successRate - a.successRate
        }
        return a.avgLatency - b.avgLatency
      })
  }

  getBestModelForIntent(intent) {
    const metrics = this.getMetricsForIntent(intent)
    const viable = metrics.filter(m => m.successRate > 0.7)
    return viable.length > 0 ? viable[0].model : null
  }

  getRecommendedModels(intent, count = 3) {
    const metrics = this.getMetricsForIntent(intent)
    return metrics
      .filter(m => m.successRate > 0.5)
      .slice(0, count)
      .map(m => ({
        model: m.model,
        successRate: m.successRate,
        avgLatency: m.avgLatency,
        confidence: this.calculateConfidence(m)
      }))
  }

  calculateConfidence(metrics) {
    const minRequests = 10
    const requestFactor = Math.min(metrics.totalRequests / minRequests, 1)
    return metrics.successRate * requestFactor
  }

  getPerformanceScore(intent, model) {
    const key = `${intent}:${model}`
    const m = this.metrics[key]
    
    if (!m || m.totalRequests < 5) {
      return 0.5
    }

    const successScore = m.successRate
    const latencyScore = 1 - Math.min(m.avgLatency / 5000, 1)
    
    return (successScore * 0.7) + (latencyScore * 0.3)
  }

  getStats() {
    const totalRequests = this.history.length
    const intents = [...new Set(this.history.map(r => r.intent))]
    const models = [...new Set(this.history.map(r => r.model))]
    const successRate = this.history.filter(r => r.success).length / totalRequests || 0
    
    return {
      totalRequests,
      uniqueIntents: intents.length,
      uniqueModels: models.length,
      overallSuccessRate: successRate,
      avgLatency: this.history.reduce((sum, r) => sum + r.latency, 0) / totalRequests || 0,
      topPerformers: this.getTopPerformers(5)
    }
  }

  getTopPerformers(count = 5) {
    return Object.values(this.metrics)
      .filter(m => m.totalRequests >= 5)
      .sort((a, b) => {
        const scoreA = this.getPerformanceScore(a.intent, a.model)
        const scoreB = this.getPerformanceScore(b.intent, b.model)
        return scoreB - scoreA
      })
      .slice(0, count)
      .map(m => ({
        intent: m.intent,
        model: m.model,
        successRate: m.successRate,
        avgLatency: m.avgLatency,
        requests: m.totalRequests,
        score: this.getPerformanceScore(m.intent, m.model)
      }))
  }
}
