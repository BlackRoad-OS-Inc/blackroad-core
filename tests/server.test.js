'use strict'

const http = require('http')
const { spawn } = require('child_process')
const path = require('path')

const PORT = 9876
let serverProcess

function request(method, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: PORT, path: urlPath, method }, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) })
        } catch {
          resolve({ status: res.statusCode, body })
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`)
      passed++
    } else {
      console.error(`  FAIL: ${message}`)
      failed++
    }
  }

  console.log('Starting server...')
  serverProcess = spawn('node', [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  })

  await sleep(1000)

  console.log('\nRunning tests:\n')

  const health = await request('GET', '/health')
  assert(health.status === 200, '/health returns 200')
  assert(health.body.status === 'ok', '/health status is ok')
  assert(health.body.service === 'blackroad-core', '/health service name correct')

  const agents = await request('GET', '/v1/agents')
  assert(agents.status === 200, '/v1/agents returns 200')
  assert(Array.isArray(agents.body.agents), '/v1/agents returns array')

  const metrics = await request('GET', '/metrics')
  assert(metrics.status === 200, '/metrics returns 200')

  const notFound = await request('GET', '/nonexistent')
  assert(notFound.status === 404, 'Unknown route returns 404')

  console.log(`\nResults: ${passed} passed, ${failed} failed`)

  serverProcess.kill()
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error(err)
  if (serverProcess) serverProcess.kill()
  process.exit(1)
})
