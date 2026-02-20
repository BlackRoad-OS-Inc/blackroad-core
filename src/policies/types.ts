// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.

export interface AgentPermission {
  providers: string[]
  maxTokens: number
  rateLimit: number
}

export interface PolicyConfig {
  agents: Record<string, AgentPermission>
}

export type PolicyDecision = 'allow' | 'deny' | 'escalate'

export interface PolicyResult {
  decision: PolicyDecision
  reason?: string
}
