// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.

export interface AgentDefinition {
  name: string
  title: string
  role: string
  providers: string[]
  capabilities: string[]
  fallbackChain: string[]
}

export class AgentRegistry {
  private agents = new Map<string, AgentDefinition>()

  register(agent: AgentDefinition): void {
    this.agents.set(agent.name, agent)
  }

  get(name: string): AgentDefinition | undefined {
    return this.agents.get(name)
  }

  list(): AgentDefinition[] {
    return [...this.agents.values()]
  }

  has(name: string): boolean {
    return this.agents.has(name)
  }
}
