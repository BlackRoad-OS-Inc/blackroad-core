// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { describe, it, expect } from 'vitest'
import { PolicyEngine } from '../../src/policies/engine.js'

const testConfig = {
  agents: {
    octavia: { providers: ['anthropic', 'openai'], maxTokens: 8192, rateLimit: 60 },
    alice: { providers: ['ollama'], maxTokens: 4096, rateLimit: 30 },
  },
}

describe('PolicyEngine', () => {
  it('should allow permitted provider', () => {
    const engine = new PolicyEngine(testConfig)
    const result = engine.evaluate('octavia', 'anthropic')
    expect(result.decision).toBe('allow')
  })

  it('should deny unpermitted provider', () => {
    const engine = new PolicyEngine(testConfig)
    const result = engine.evaluate('alice', 'anthropic')
    expect(result.decision).toBe('deny')
    expect(result.reason).toContain('not allowed')
  })

  it('should deny unknown agent', () => {
    const engine = new PolicyEngine(testConfig)
    const result = engine.evaluate('unknown', 'anthropic')
    expect(result.decision).toBe('deny')
    expect(result.reason).toContain('Unknown agent')
  })

  it('should deny when token count exceeds limit', () => {
    const engine = new PolicyEngine(testConfig)
    const result = engine.evaluate('alice', 'ollama', 10000)
    expect(result.decision).toBe('deny')
    expect(result.reason).toContain('exceeds limit')
  })

  it('should allow within token limit', () => {
    const engine = new PolicyEngine(testConfig)
    const result = engine.evaluate('octavia', 'anthropic', 4096)
    expect(result.decision).toBe('allow')
  })

  it('should list agents', () => {
    const engine = new PolicyEngine(testConfig)
    expect(engine.listAgents()).toEqual(['octavia', 'alice'])
  })
})
