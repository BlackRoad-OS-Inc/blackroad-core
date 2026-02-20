// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { AgentDefinition } from './registry.js'
import type { ProviderRegistry } from '../providers/registry.js'
import type { ProviderChatResponse } from '../providers/types.js'
import type { Message } from '../protocol/schemas.js'
import { ProviderError } from '../protocol/errors.js'
import { logger } from '../telemetry/logger.js'

export class AgentInvoker {
  constructor(private providers: ProviderRegistry) {}

  async invoke(
    agent: AgentDefinition,
    messages: Message[],
    maxTokens?: number,
  ): Promise<ProviderChatResponse> {
    for (const providerName of agent.fallbackChain) {
      const provider = this.providers.get(providerName)
      if (!provider) continue

      try {
        const available = await provider.isAvailable()
        if (!available) {
          logger.warn({ provider: providerName, agent: agent.name }, 'Provider unavailable, trying next')
          continue
        }

        return await provider.chat({
          model: '',
          messages,
          maxTokens: maxTokens ?? 1024,
        })
      } catch (error) {
        logger.error({ provider: providerName, agent: agent.name, error }, 'Provider failed, trying next')
        continue
      }
    }

    throw new ProviderError(
      `All providers exhausted for agent ${agent.name}`,
      'PROVIDER_UNAVAILABLE',
      502,
    )
  }
}
