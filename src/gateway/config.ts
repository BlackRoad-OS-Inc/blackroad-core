// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.

export interface ProviderConfig {
  enabled: boolean
  baseUrl: string
}

export interface GatewayConfig {
  port: number
  host: string
  logLevel: string
  rateLimit: { windowMs: number; maxRequests: number }
  providers: Record<string, ProviderConfig>
}

export function loadConfig(): GatewayConfig {
  return {
    port: parseInt(process.env.BLACKROAD_GATEWAY_PORT ?? '8787', 10),
    host: process.env.BLACKROAD_GATEWAY_HOST ?? '127.0.0.1',
    logLevel: process.env.BLACKROAD_LOG_LEVEL ?? 'info',
    rateLimit: {
      windowMs: 60_000,
      maxRequests: 100,
    },
    providers: {
      anthropic: {
        enabled: true,
        baseUrl: process.env.BLACKROAD_ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com',
      },
      openai: {
        enabled: true,
        baseUrl: process.env.BLACKROAD_OPENAI_BASE_URL ?? 'https://api.openai.com',
      },
      ollama: {
        enabled: true,
        baseUrl: process.env.BLACKROAD_OLLAMA_URL ?? 'http://localhost:11434',
      },
      gemini: {
        enabled: true,
        baseUrl:
          process.env.BLACKROAD_GEMINI_BASE_URL ??
          'https://generativelanguage.googleapis.com',
      },
    },
  }
}
