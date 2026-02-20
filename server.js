'use strict'

const http = require('http')
const { randomUUID } = require('crypto')

const PORT = Number(process.env.PORT) || 8080
const VERSION = '0.1.0'

const metrics = {
  totalRequests: 0,
  startTime: Date.now(),
  snapshot() {
    return {
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      total_requests: this.totalRequests
    }
  }
}

const server = http.createServer((req, res) => {
  metrics.totalRequests++
  const requestId = randomUUID()

  const send = (code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
  }

  if (req.method === 'GET' && (req.url === '/health' || req.url === '/healthz')) {
    return send(200, {
      status: 'ok',
      service: 'blackroad-core',
      version: VERSION,
      timestamp: new Date().toISOString()
    })
  }

  if (req.method === 'GET' && req.url === '/metrics') {
    return send(200, { status: 'ok', metrics: metrics.snapshot() })
  }

  if (req.method === 'GET' && req.url === '/v1/agents') {
    return send(200, { status: 'ok', agents: [], request_id: requestId })
  }

  if (req.method === 'POST' && req.url === '/v1/agent') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
        if (!payload.agent || !payload.intent || typeof payload.input !== 'string') {
          return send(400, { status: 'error', error: 'Missing agent, intent, or input', request_id: requestId })
        }
        return send(200, {
          status: 'ok',
          output: '',
          request_id: requestId,
          message: 'Agent invocation not yet connected to providers'
        })
      } catch {
        return send(400, { status: 'error', error: 'Invalid JSON', request_id: requestId })
      }
    })
    return
  }

  send(404, { status: 'error', error: 'Not found', request_id: requestId })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`BlackRoad Core v${VERSION} listening on 0.0.0.0:${PORT}`)
  console.log('  POST /v1/agent   - Agent invocation')
  console.log('  GET  /v1/agents  - Agent roster')
  console.log('  GET  /health     - Health check')
  console.log('  GET  /metrics    - Metrics')
})
