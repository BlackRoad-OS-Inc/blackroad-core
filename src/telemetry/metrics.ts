// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.

export interface MetricsSnapshot {
  requests: { total: number; success: number; error: number }
  latency: number[]
  providers: Record<string, { requests: number; errors: number }>
}

export class MetricsCollector {
  private requestCount = 0
  private successCount = 0
  private errorCount = 0
  private latencies: number[] = []
  private providerMetrics: Record<string, { requests: number; errors: number }> = {}

  recordRequest(provider: string, durationMs: number, success: boolean): void {
    this.requestCount++
    this.latencies.push(durationMs)
    if (success) {
      this.successCount++
    } else {
      this.errorCount++
    }
    if (!this.providerMetrics[provider]) {
      this.providerMetrics[provider] = { requests: 0, errors: 0 }
    }
    this.providerMetrics[provider].requests++
    if (!success) {
      this.providerMetrics[provider].errors++
    }
  }

  snapshot(): MetricsSnapshot {
    return {
      requests: {
        total: this.requestCount,
        success: this.successCount,
        error: this.errorCount,
      },
      latency: [...this.latencies],
      providers: { ...this.providerMetrics },
    }
  }
}

export const metrics = new MetricsCollector()
