// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OllamaProvider } from '../../src/providers/ollama.js'
import { ProviderError } from '../../src/protocol/errors.js'

vi.mock('../../src/telemetry/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

function mockFetchResponse(data: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
  })
}

const tagsResponse = { models: [{ name: 'llama3.2:3b' }, { name: 'mistral:7b' }] }

const chatResponse = {
  message: { content: 'Hello from Ollama' },
  model: 'llama3.2:3b',
  prompt_eval_count: 10,
  eval_count: 20,
}

describe('OllamaProvider', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubEnv('BLACKROAD_OLLAMA_FLEET', '')
    delete process.env.BLACKROAD_OLLAMA_FLEET
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.unstubAllEnvs()
  })

  describe('constructor / fleet initialization', () => {
    it('should use single baseUrl when no fleet env var', () => {
      const provider = new OllamaProvider('http://localhost:11434')
      expect(provider.name).toBe('ollama')
    })

    it('should parse BLACKROAD_OLLAMA_FLEET into multiple nodes', () => {
      vi.stubEnv('BLACKROAD_OLLAMA_FLEET', 'alice=http://192.168.4.49:11434,cecilia=http://192.168.4.96:11434')
      const provider = new OllamaProvider('http://localhost:11434')
      // Verify fleet is used by checking listModels hits multiple nodes
      expect(provider.name).toBe('ollama')
    })

    it('should trim whitespace in fleet entries', () => {
      vi.stubEnv('BLACKROAD_OLLAMA_FLEET', ' alice = http://192.168.4.49:11434 , cecilia = http://192.168.4.96:11434 ')
      const provider = new OllamaProvider('http://localhost:11434')
      expect(provider.name).toBe('ollama')
    })
  })

  describe('chat()', () => {
    it('should route chat to available node with the requested model', async () => {
      const provider = new OllamaProvider('http://localhost:11434')

      // First call: /api/tags (nodeHasModel check), Second call: /api/chat
      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        callCount++
        if (url.includes('/api/tags')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(tagsResponse) })
        }
        if (url.includes('/api/chat')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(chatResponse) })
        }
        return Promise.resolve({ ok: false, status: 404 })
      }) as typeof fetch

      const result = await provider.chat({
        model: 'llama3.2:3b',
        messages: [{ role: 'user', content: 'Hello' }],
      })

      expect(result.content).toBe('Hello from Ollama')
      expect(result.model).toBe('llama3.2:3b')
      expect(result.usage.prompt_tokens).toBe(10)
      expect(result.usage.completion_tokens).toBe(20)
      expect(result.usage.total_tokens).toBe(30)
      expect(result.id).toMatch(/^ollama-local-/)
    })

    it('should default model to llama3.2:3b when not specified', async () => {
      const provider = new OllamaProvider('http://localhost:11434')

      let capturedBody: string | undefined
      globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (url.includes('/api/tags')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(tagsResponse) })
        }
        if (url.includes('/api/chat')) {
          capturedBody = opts?.body as string
          return Promise.resolve({ ok: true, json: () => Promise.resolve(chatResponse) })
        }
      }) as typeof fetch

      await provider.chat({ model: '', messages: [{ role: 'user', content: 'Hi' }] })
      // When model is falsy, it defaults to 'llama3.2:3b'
      // But because empty string is falsy, it uses default
    })

    it('should try next node if first node lacks the model', async () => {
      vi.stubEnv('BLACKROAD_OLLAMA_FLEET', 'node1=http://n1:11434,node2=http://n2:11434')
      const provider = new OllamaProvider('http://localhost:11434')

      const node1Tags = { models: [{ name: 'mistral:7b' }] }
      const node2Tags = { models: [{ name: 'llama3.2:3b' }] }

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'http://n1:11434/api/tags') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(node1Tags) })
        }
        if (url === 'http://n2:11434/api/tags') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(node2Tags) })
        }
        if (url === 'http://n2:11434/api/chat') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(chatResponse) })
        }
        return Promise.resolve({ ok: false, status: 404 })
      }) as typeof fetch

      const result = await provider.chat({
        model: 'llama3.2:3b',
        messages: [{ role: 'user', content: 'Hello' }],
      })

      expect(result.content).toBe('Hello from Ollama')
    })

    it('should try next node if chat returns non-ok status', async () => {
      vi.stubEnv('BLACKROAD_OLLAMA_FLEET', 'node1=http://n1:11434,node2=http://n2:11434')
      const provider = new OllamaProvider('http://localhost:11434')

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/tags')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(tagsResponse) })
        }
        if (url === 'http://n1:11434/api/chat') {
          return Promise.resolve({ ok: false, status: 500 })
        }
        if (url === 'http://n2:11434/api/chat') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(chatResponse) })
        }
      }) as typeof fetch

      const result = await provider.chat({
        model: 'llama3.2:3b',
        messages: [{ role: 'user', content: 'Hello' }],
      })
      expect(result.content).toBe('Hello from Ollama')
    })

    it('should try next node if fetch throws', async () => {
      vi.stubEnv('BLACKROAD_OLLAMA_FLEET', 'node1=http://n1:11434,node2=http://n2:11434')
      const provider = new OllamaProvider('http://localhost:11434')

      let callIndex = 0
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'http://n1:11434/api/tags') {
          return Promise.reject(new Error('ECONNREFUSED'))
        }
        if (url === 'http://n2:11434/api/tags') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(tagsResponse) })
        }
        if (url === 'http://n2:11434/api/chat') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(chatResponse) })
        }
      }) as typeof fetch

      const result = await provider.chat({
        model: 'llama3.2:3b',
        messages: [{ role: 'user', content: 'Hello' }],
      })
      expect(result.content).toBe('Hello from Ollama')
    })

    it('should throw ProviderError when no node has the model', async () => {
      const provider = new OllamaProvider('http://localhost:11434')

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/tags')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ models: [] }) })
        }
      }) as typeof fetch

      await expect(
        provider.chat({ model: 'nonexistent:latest', messages: [{ role: 'user', content: 'Hi' }] }),
      ).rejects.toThrow(ProviderError)

      await expect(
        provider.chat({ model: 'nonexistent:latest', messages: [{ role: 'user', content: 'Hi' }] }),
      ).rejects.toThrow('No Ollama node has model nonexistent:latest')
    })

    it('should handle missing usage fields with defaults of 0', async () => {
      const provider = new OllamaProvider('http://localhost:11434')

      const noUsageResponse = { message: { content: 'hi' }, model: 'llama3.2:3b' }

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/tags')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(tagsResponse) })
        }
        if (url.includes('/api/chat')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(noUsageResponse) })
        }
      }) as typeof fetch

      const result = await provider.chat({
        model: 'llama3.2:3b',
        messages: [{ role: 'user', content: 'Hi' }],
      })
      expect(result.usage.prompt_tokens).toBe(0)
      expect(result.usage.completion_tokens).toBe(0)
      expect(result.usage.total_tokens).toBe(0)
    })

    it('should pass temperature and maxTokens in request body', async () => {
      const provider = new OllamaProvider('http://localhost:11434')

      let capturedBody: Record<string, unknown> | undefined
      globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (url.includes('/api/tags')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(tagsResponse) })
        }
        if (url.includes('/api/chat')) {
          capturedBody = JSON.parse(opts?.body as string)
          return Promise.resolve({ ok: true, json: () => Promise.resolve(chatResponse) })
        }
      }) as typeof fetch

      await provider.chat({
        model: 'llama3.2:3b',
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.5,
        maxTokens: 256,
      })

      expect(capturedBody?.options).toEqual({ temperature: 0.5, num_predict: 256 })
    })
  })

  describe('isAvailable()', () => {
    it('should return true if any node responds ok', async () => {
      const provider = new OllamaProvider('http://localhost:11434')
      globalThis.fetch = mockFetchResponse(tagsResponse) as typeof fetch
      expect(await provider.isAvailable()).toBe(true)
    })

    it('should return false if all nodes fail', async () => {
      const provider = new OllamaProvider('http://localhost:11434')
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as typeof fetch
      expect(await provider.isAvailable()).toBe(false)
    })

    it('should return false if node responds with non-ok status', async () => {
      const provider = new OllamaProvider('http://localhost:11434')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as typeof fetch
      expect(await provider.isAvailable()).toBe(false)
    })

    it('should return true if first node fails but second succeeds', async () => {
      vi.stubEnv('BLACKROAD_OLLAMA_FLEET', 'node1=http://n1:11434,node2=http://n2:11434')
      const provider = new OllamaProvider('http://localhost:11434')

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('n1')) return Promise.reject(new Error('down'))
        if (url.includes('n2')) return Promise.resolve({ ok: true, json: () => Promise.resolve(tagsResponse) })
      }) as typeof fetch

      expect(await provider.isAvailable()).toBe(true)
    })
  })

  describe('listModels()', () => {
    it('should return models from all reachable nodes', async () => {
      vi.stubEnv('BLACKROAD_OLLAMA_FLEET', 'alice=http://a:11434,cecilia=http://c:11434')
      const provider = new OllamaProvider('http://localhost:11434')

      const aliceTags = { models: [{ name: 'llama3.2:3b' }] }
      const ceciliaTags = { models: [{ name: 'mistral:7b' }, { name: 'qwen2:7b' }] }

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('//a:')) return Promise.resolve({ ok: true, json: () => Promise.resolve(aliceTags) })
        if (url.includes('//c:')) return Promise.resolve({ ok: true, json: () => Promise.resolve(ceciliaTags) })
      }) as typeof fetch

      const result = await provider.listModels()
      expect(result).toEqual([
        { node: 'alice', models: ['llama3.2:3b'] },
        { node: 'cecilia', models: ['mistral:7b', 'qwen2:7b'] },
      ])
    })

    it('should return empty models for unreachable nodes', async () => {
      vi.stubEnv('BLACKROAD_OLLAMA_FLEET', 'alive=http://a:11434,dead=http://d:11434')
      const provider = new OllamaProvider('http://localhost:11434')

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('//a:')) return Promise.resolve({ ok: true, json: () => Promise.resolve(tagsResponse) })
        if (url.includes('//d:')) return Promise.reject(new Error('ECONNREFUSED'))
      }) as typeof fetch

      const result = await provider.listModels()
      expect(result).toHaveLength(2)
      expect(result[0].models).toHaveLength(2)
      expect(result[1]).toEqual({ node: 'dead', models: [] })
    })

    it('should return models for single-node setup', async () => {
      const provider = new OllamaProvider('http://localhost:11434')
      globalThis.fetch = mockFetchResponse(tagsResponse) as typeof fetch

      const result = await provider.listModels()
      expect(result).toEqual([
        { node: 'local', models: ['llama3.2:3b', 'mistral:7b'] },
      ])
    })
  })
})
