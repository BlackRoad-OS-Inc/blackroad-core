// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { PolicyConfig, PolicyResult } from './types.js'

export class PolicyEngine {
  constructor(private config: PolicyConfig) {}

  evaluate(agentId: string, provider: string, tokenCount?: number): PolicyResult {
    const permissions = this.config.agents[agentId]
    if (!permissions) {
      return { decision: 'deny', reason: `Unknown agent: ${agentId}` }
    }

    if (!permissions.providers.includes(provider)) {
      return {
        decision: 'deny',
        reason: `Agent ${agentId} is not allowed to use provider ${provider}`,
      }
    }

    if (tokenCount !== undefined && tokenCount > permissions.maxTokens) {
      return {
        decision: 'deny',
        reason: `Token count ${tokenCount} exceeds limit ${permissions.maxTokens} for agent ${agentId}`,
      }
    }

    return { decision: 'allow' }
  }

  getAgentPermissions(agentId: string) {
    return this.config.agents[agentId]
  }

  listAgents(): string[] {
    return Object.keys(this.config.agents)
  }
}
