// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.

export class GatewayError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message)
    this.name = 'GatewayError'
  }

  toJSON() {
    return { error: { code: this.code, message: this.message, status: this.status } }
  }
}

export class ProviderError extends GatewayError {
  constructor(message: string, code = 'PROVIDER_REQUEST_FAILED', status = 502) {
    super(message, code, status)
    this.name = 'ProviderError'
  }
}

export class PolicyError extends GatewayError {
  constructor(message: string, code = 'POLICY_DENIED', status = 403) {
    super(message, code, status)
    this.name = 'PolicyError'
  }
}

export class ValidationError extends GatewayError {
  constructor(message: string, code = 'VALIDATION_FAILED', status = 400) {
    super(message, code, status)
    this.name = 'ValidationError'
  }
}
