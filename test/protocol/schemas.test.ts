// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { describe, it, expect } from 'vitest'
import { ChatRequestSchema, InvokeRequestSchema, MessageSchema } from '../../src/protocol/schemas.js'

describe('Protocol Schemas', () => {
  describe('MessageSchema', () => {
    it('should validate a valid message', () => {
      const result = MessageSchema.safeParse({ role: 'user', content: 'Hello' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid role', () => {
      const result = MessageSchema.safeParse({ role: 'invalid', content: 'Hello' })
      expect(result.success).toBe(false)
    })
  })

  describe('ChatRequestSchema', () => {
    it('should validate a minimal chat request', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }],
      })
      expect(result.success).toBe(true)
    })

    it('should apply defaults', () => {
      const result = ChatRequestSchema.parse({
        messages: [{ role: 'user', content: 'Hello' }],
      })
      expect(result.temperature).toBe(0.7)
      expect(result.stream).toBe(false)
    })

    it('should reject empty messages array', () => {
      const result = ChatRequestSchema.safeParse({ messages: [] })
      expect(result.success).toBe(false)
    })

    it('should reject invalid temperature', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 5,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('InvokeRequestSchema', () => {
    it('should validate a valid invoke request', () => {
      const result = InvokeRequestSchema.safeParse({
        agent: 'octavia',
        task: 'Design an API',
      })
      expect(result.success).toBe(true)
    })

    it('should reject missing agent', () => {
      const result = InvokeRequestSchema.safeParse({ task: 'Do something' })
      expect(result.success).toBe(false)
    })
  })
})
