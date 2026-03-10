// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { describe, it, expect, vi } from 'vitest'
import { AgentInvoker } from '../../src/agents/invoker.js'
import { ProviderRegistry } from '../../src/providers/registry.js'
import { ProviderError } from '../../src/protocol/errors.js'
import type { Provider, ProviderChatResponse } from '../../src/providers/types.js'
import type { AgentDefinition } from '../../src/agents/registry.js'

vi.mock('../../src/telemetry/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

function makeProvider(name: string, opts?: { available?: boolean; response?: ProviderChatResponse; shouldThrow?: boolean }): Provider {
  const available = opts?.available ?? true
  const response: ProviderChatResponse = opts?.response ?? {
    id: `${name}-1`,
    content: `Response from ${name}`,
    model: 'llama3.2:3b',
    usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
  }

  return {
    name,
    chat: opts?.shouldThrow
      ? vi.fn().mockRejectedValue(new Error(`${name} exploded`))
      : vi.fn().mockResolvedValue(response),
    isAvailable: vi.fn().mockResolvedValue(available),
  }
}

function makeAgent(overrides?: Partial<AgentDefinition>): AgentDefinition {
  return {
    name: 'cece',
    title: 'CECE',
    role: 'companion',
    providers: ['ollama'],
    capabilities: ['chat'],
    fallbackChain: ['ollama'],
    ...overrides,
  }
}

describe('AgentInvoker', () => {
  it('should invoke the first available provider in the fallback chain', async () => {
    const registry = new ProviderRegistry()
    const ollama = makeProvider('ollama')
    registry.register(ollama)

    const invoker = new AgentInvoker(registry)
    const agent = makeAgent()

    const result = await invoker.invoke(agent, [{ role: 'user', content: 'Hello' }])
    expect(result.content).toBe('Response from ollama')
    expect(ollama.chat).toHaveBeenCalledOnce()
  })

  it('should skip unavailable providers and use the next one', async () => {
    const registry = new ProviderRegistry()
    registry.register(makeProvider('ollama', { available: false }))
    const anthropic = makeProvider('anthropic')
    registry.register(anthropic)

    const invoker = new AgentInvoker(registry)
    const agent = makeAgent({ fallbackChain: ['ollama', 'anthropic'] })

    const result = await invoker.invoke(agent, [{ role: 'user', content: 'Hi' }])
    expect(result.content).toBe('Response from anthropic')
  })

  it('should skip providers not in registry', async () => {
    const registry = new ProviderRegistry()
    const ollama = makeProvider('ollama')
    registry.register(ollama)

    const invoker = new AgentInvoker(registry)
    const agent = makeAgent({ fallbackChain: ['nonexistent', 'ollama'] })

    const result = await invoker.invoke(agent, [{ role: 'user', content: 'Hi' }])
    expect(result.content).toBe('Response from ollama')
  })

  it('should skip providers that throw and try the next', async () => {
    const registry = new ProviderRegistry()
    registry.register(makeProvider('ollama', { shouldThrow: true }))
    const anthropic = makeProvider('anthropic')
    registry.register(anthropic)

    const invoker = new AgentInvoker(registry)
    const agent = makeAgent({ fallbackChain: ['ollama', 'anthropic'] })

    const result = await invoker.invoke(agent, [{ role: 'user', content: 'Hi' }])
    expect(result.content).toBe('Response from anthropic')
  })

  it('should throw ProviderError when all providers are exhausted', async () => {
    const registry = new ProviderRegistry()
    registry.register(makeProvider('ollama', { available: false }))
    registry.register(makeProvider('anthropic', { shouldThrow: true }))

    const invoker = new AgentInvoker(registry)
    const agent = makeAgent({ fallbackChain: ['ollama', 'anthropic'] })

    await expect(
      invoker.invoke(agent, [{ role: 'user', content: 'Hi' }]),
    ).rejects.toThrow(ProviderError)

    await expect(
      invoker.invoke(agent, [{ role: 'user', content: 'Hi' }]),
    ).rejects.toThrow('All providers exhausted for agent cece')
  })

  it('should throw ProviderError with status 502', async () => {
    const registry = new ProviderRegistry()
    const invoker = new AgentInvoker(registry)
    const agent = makeAgent({ fallbackChain: ['missing'] })

    try {
      await invoker.invoke(agent, [{ role: 'user', content: 'Hi' }])
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError)
      expect((error as ProviderError).status).toBe(502)
      expect((error as ProviderError).code).toBe('PROVIDER_UNAVAILABLE')
    }
  })

  it('should pass maxTokens to provider.chat', async () => {
    const registry = new ProviderRegistry()
    const ollama = makeProvider('ollama')
    registry.register(ollama)

    const invoker = new AgentInvoker(registry)
    const agent = makeAgent()

    await invoker.invoke(agent, [{ role: 'user', content: 'Hi' }], 2048)
    expect(ollama.chat).toHaveBeenCalledWith({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 2048,
    })
  })

  it('should default maxTokens to 1024 when not provided', async () => {
    const registry = new ProviderRegistry()
    const ollama = makeProvider('ollama')
    registry.register(ollama)

    const invoker = new AgentInvoker(registry)
    const agent = makeAgent()

    await invoker.invoke(agent, [{ role: 'user', content: 'Hi' }])
    expect(ollama.chat).toHaveBeenCalledWith(
      expect.objectContaining({ maxTokens: 1024 }),
    )
  })

  it('should work with empty fallback chain (throws immediately)', async () => {
    const registry = new ProviderRegistry()
    const invoker = new AgentInvoker(registry)
    const agent = makeAgent({ fallbackChain: [] })

    await expect(
      invoker.invoke(agent, [{ role: 'user', content: 'Hi' }]),
    ).rejects.toThrow(ProviderError)
  })
})
