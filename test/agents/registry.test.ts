// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { describe, it, expect } from 'vitest'
import { AgentRegistry } from '../../src/agents/registry.js'
import type { AgentDefinition } from '../../src/agents/registry.js'

function makeAgent(name: string, overrides?: Partial<AgentDefinition>): AgentDefinition {
  return {
    name,
    title: `Agent ${name}`,
    role: 'assistant',
    providers: ['ollama'],
    capabilities: ['chat'],
    fallbackChain: ['ollama'],
    ...overrides,
  }
}

describe('AgentRegistry', () => {
  it('should register and retrieve an agent', () => {
    const registry = new AgentRegistry()
    const agent = makeAgent('cece')
    registry.register(agent)
    expect(registry.get('cece')).toBe(agent)
  })

  it('should return undefined for unknown agent', () => {
    const registry = new AgentRegistry()
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('should list all registered agents', () => {
    const registry = new AgentRegistry()
    registry.register(makeAgent('cece'))
    registry.register(makeAgent('lucidia'))
    registry.register(makeAgent('aria'))
    const list = registry.list()
    expect(list).toHaveLength(3)
    expect(list.map((a) => a.name)).toEqual(['cece', 'lucidia', 'aria'])
  })

  it('should check agent existence with has()', () => {
    const registry = new AgentRegistry()
    registry.register(makeAgent('cece'))
    expect(registry.has('cece')).toBe(true)
    expect(registry.has('unknown')).toBe(false)
  })

  it('should overwrite agent with same name on re-register', () => {
    const registry = new AgentRegistry()
    const v1 = makeAgent('cece', { role: 'v1' })
    const v2 = makeAgent('cece', { role: 'v2' })
    registry.register(v1)
    registry.register(v2)
    expect(registry.get('cece')?.role).toBe('v2')
    expect(registry.list()).toHaveLength(1)
  })

  it('should return an empty list when no agents registered', () => {
    const registry = new AgentRegistry()
    expect(registry.list()).toEqual([])
  })

  it('should preserve agent definition fields', () => {
    const registry = new AgentRegistry()
    const agent = makeAgent('cece', {
      title: 'CECE',
      role: 'companion',
      providers: ['ollama', 'anthropic'],
      capabilities: ['chat', 'code', 'memory'],
      fallbackChain: ['ollama', 'anthropic'],
    })
    registry.register(agent)

    const retrieved = registry.get('cece')!
    expect(retrieved.title).toBe('CECE')
    expect(retrieved.role).toBe('companion')
    expect(retrieved.providers).toEqual(['ollama', 'anthropic'])
    expect(retrieved.capabilities).toEqual(['chat', 'code', 'memory'])
    expect(retrieved.fallbackChain).toEqual(['ollama', 'anthropic'])
  })
})
