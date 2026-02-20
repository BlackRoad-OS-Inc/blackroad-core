// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { describe, it, expect } from 'vitest'
import { ProviderRegistry } from '../../src/providers/registry.js'
import type { Provider } from '../../src/providers/types.js'

function mockProvider(name: string): Provider {
  return {
    name,
    async chat() {
      return { id: '1', content: 'test', model: 'test', usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } }
    },
    async isAvailable() {
      return true
    },
  }
}

describe('ProviderRegistry', () => {
  it('should register and retrieve a provider', () => {
    const registry = new ProviderRegistry()
    const provider = mockProvider('test')
    registry.register(provider)
    expect(registry.get('test')).toBe(provider)
  })

  it('should return undefined for unknown provider', () => {
    const registry = new ProviderRegistry()
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('should list all providers', () => {
    const registry = new ProviderRegistry()
    registry.register(mockProvider('a'))
    registry.register(mockProvider('b'))
    expect(registry.list()).toHaveLength(2)
  })

  it('should check provider existence', () => {
    const registry = new ProviderRegistry()
    registry.register(mockProvider('test'))
    expect(registry.has('test')).toBe(true)
    expect(registry.has('other')).toBe(false)
  })
})
