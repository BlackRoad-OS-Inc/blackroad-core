// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { describe, it, expect } from 'vitest'
import { GatewayError, ProviderError, PolicyError, ValidationError } from '../../src/protocol/errors.js'

describe('GatewayError', () => {
  it('should set message, code, and status', () => {
    const err = new GatewayError('something broke', 'INTERNAL', 500)
    expect(err.message).toBe('something broke')
    expect(err.code).toBe('INTERNAL')
    expect(err.status).toBe(500)
    expect(err.name).toBe('GatewayError')
  })

  it('should extend Error', () => {
    const err = new GatewayError('test', 'TEST', 500)
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(GatewayError)
  })

  it('should serialize to JSON with error envelope', () => {
    const err = new GatewayError('not found', 'NOT_FOUND', 404)
    expect(err.toJSON()).toEqual({
      error: { code: 'NOT_FOUND', message: 'not found', status: 404 },
    })
  })
})

describe('ProviderError', () => {
  it('should default to code PROVIDER_REQUEST_FAILED and status 502', () => {
    const err = new ProviderError('node down')
    expect(err.code).toBe('PROVIDER_REQUEST_FAILED')
    expect(err.status).toBe(502)
    expect(err.name).toBe('ProviderError')
  })

  it('should accept custom code and status', () => {
    const err = new ProviderError('timeout', 'PROVIDER_TIMEOUT', 504)
    expect(err.code).toBe('PROVIDER_TIMEOUT')
    expect(err.status).toBe(504)
  })

  it('should extend GatewayError', () => {
    const err = new ProviderError('test')
    expect(err).toBeInstanceOf(GatewayError)
    expect(err).toBeInstanceOf(Error)
  })

  it('should serialize via toJSON inherited from GatewayError', () => {
    const err = new ProviderError('bad gateway')
    expect(err.toJSON()).toEqual({
      error: { code: 'PROVIDER_REQUEST_FAILED', message: 'bad gateway', status: 502 },
    })
  })
})

describe('PolicyError', () => {
  it('should default to code POLICY_DENIED and status 403', () => {
    const err = new PolicyError('access denied')
    expect(err.code).toBe('POLICY_DENIED')
    expect(err.status).toBe(403)
    expect(err.name).toBe('PolicyError')
  })

  it('should accept custom code and status', () => {
    const err = new PolicyError('rate limited', 'RATE_LIMIT', 429)
    expect(err.code).toBe('RATE_LIMIT')
    expect(err.status).toBe(429)
  })

  it('should extend GatewayError', () => {
    const err = new PolicyError('test')
    expect(err).toBeInstanceOf(GatewayError)
  })
})

describe('ValidationError', () => {
  it('should default to code VALIDATION_FAILED and status 400', () => {
    const err = new ValidationError('invalid input')
    expect(err.code).toBe('VALIDATION_FAILED')
    expect(err.status).toBe(400)
    expect(err.name).toBe('ValidationError')
  })

  it('should accept custom code and status', () => {
    const err = new ValidationError('missing field', 'MISSING_FIELD', 422)
    expect(err.code).toBe('MISSING_FIELD')
    expect(err.status).toBe(422)
  })

  it('should extend GatewayError', () => {
    const err = new ValidationError('test')
    expect(err).toBeInstanceOf(GatewayError)
  })

  it('should serialize via toJSON', () => {
    const err = new ValidationError('bad request')
    expect(err.toJSON()).toEqual({
      error: { code: 'VALIDATION_FAILED', message: 'bad request', status: 400 },
    })
  })
})
