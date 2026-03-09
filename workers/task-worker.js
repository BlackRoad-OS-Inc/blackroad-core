/**
 * BlackRoad Task Worker — Cloudflare Workers
 *
 * Handles long-running AI gateway tasks that exceed typical HTTP timeouts.
 * Acts as an async task dispatcher: accepts a task payload, enqueues it,
 * and returns a task ID immediately. Clients poll /task/:id for results.
 *
 * Endpoints:
 *   POST /dispatch  — submit a long-running agent task
 *   GET  /task/:id  — poll task status/result
 *   GET  /healthz   — health check
 *
 * Tasks are forwarded to the BlackRoad Gateway.
 * Gateway URL is set via BLACKROAD_GATEWAY_URL env var (Workers secret).
 */

// ---------------------------------------------------------------------------
// In-memory task store (Durable Objects / KV can be used for persistence)
// ---------------------------------------------------------------------------
const tasks = new Map()

function generateId() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Dispatch a task to the BlackRoad Gateway with retry logic
// ---------------------------------------------------------------------------
async function dispatchToGateway(gatewayUrl, payload, taskId) {
  const maxAttempts = 3
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${gatewayUrl}/v1/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Task-ID': taskId,
          'X-Worker-Dispatch': '1'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000) // 25s per attempt, stay under CF 30s CPU limit
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || `Gateway error ${res.status}`)
      }

      return { ok: true, data }
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts) {
        await scheduler.wait(1000 * attempt) // exponential back-off using Workers scheduler API
      }
    }
  }

  throw lastError || new Error('Gateway unreachable after retries')
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const gatewayUrl = env.BLACKROAD_GATEWAY_URL || 'http://127.0.0.1:8787'

    // ------------------------------------------------------------------
    // Health check
    // ------------------------------------------------------------------
    if (request.method === 'GET' && url.pathname === '/healthz') {
      return Response.json({
        status: 'ok',
        worker: 'blackroad-task-worker',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      })
    }

    // ------------------------------------------------------------------
    // POST /dispatch — submit a long-running agent task
    // ------------------------------------------------------------------
    if (request.method === 'POST' && url.pathname === '/dispatch') {
      let payload
      try {
        payload = await request.json()
      } catch {
        return Response.json({ status: 'error', error: 'Invalid JSON' }, { status: 400 })
      }

      if (!payload.agent || !payload.intent || typeof payload.input !== 'string') {
        return Response.json(
          { status: 'error', error: 'Missing required fields: agent, intent, input' },
          { status: 400 }
        )
      }

      const taskId = generateId()
      const createdAt = new Date().toISOString()

      // Store task as pending
      tasks.set(taskId, { status: 'pending', createdAt, payload })

      // Dispatch to gateway asynchronously (non-blocking response)
      const dispatchPromise = dispatchToGateway(gatewayUrl, payload, taskId)
        .then(result => {
          tasks.set(taskId, {
            status: 'complete',
            createdAt,
            completedAt: new Date().toISOString(),
            result: result.data
          })
        })
        .catch(err => {
          tasks.set(taskId, {
            status: 'error',
            createdAt,
            completedAt: new Date().toISOString(),
            error: err.message
          })
        })

      // Use waitUntil to allow async work to complete after response is sent
      ctx.waitUntil(dispatchPromise)

      return Response.json(
        { status: 'accepted', task_id: taskId, created_at: createdAt },
        { status: 202 }
      )
    }

    // ------------------------------------------------------------------
    // GET /task/:id — poll task result
    // ------------------------------------------------------------------
    const taskMatch = url.pathname.match(/^\/task\/([0-9a-f]{32})$/)
    if (request.method === 'GET' && taskMatch) {
      const taskId = taskMatch[1]
      const task = tasks.get(taskId)

      if (!task) {
        return Response.json({ status: 'error', error: 'Task not found' }, { status: 404 })
      }

      return Response.json({ status: 'ok', task_id: taskId, ...task })
    }

    // ------------------------------------------------------------------
    // 404
    // ------------------------------------------------------------------
    return Response.json({ status: 'error', error: 'Not found' }, { status: 404 })
  }
}
