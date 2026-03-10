// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { Provider, ProviderChatRequest, ProviderChatResponse } from './types.js'
import { ProviderError } from '../protocol/errors.js'
import { logger } from '../telemetry/logger.js'

interface OllamaNode {
  name: string
  url: string
}

export class OllamaProvider implements Provider {
  readonly name = 'ollama'
  private nodes: OllamaNode[]

  constructor(baseUrl: string) {
    // Parse BLACKROAD_OLLAMA_FLEET or fall back to single URL
    const fleet = process.env.BLACKROAD_OLLAMA_FLEET
    if (fleet) {
      // Format: "name=url,name=url" e.g. "local=http://localhost:11434,octavia=http://192.168.4.100:11434"
      this.nodes = fleet.split(',').map((entry) => {
        const [name, url] = entry.split('=')
        return { name: name.trim(), url: url.trim() }
      })
    } else {
      this.nodes = [{ name: 'local', url: baseUrl }]
    }
    logger.info({ nodes: this.nodes.map((n) => n.name) }, 'Ollama fleet initialized')
  }

  async chat(request: ProviderChatRequest): Promise<ProviderChatResponse> {
    const model = request.model || 'llama3.2:3b'

    // Try each node in order until one works
    for (const node of this.nodes) {
      try {
        const available = await this.nodeHasModel(node, model)
        if (!available) continue

        logger.info({ node: node.name, model }, 'Routing to Ollama node')

        const response = await fetch(`${node.url}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
            stream: false,
            options: { temperature: request.temperature, num_predict: request.maxTokens },
          }),
          signal: AbortSignal.timeout(120_000),
        })

        if (!response.ok) {
          logger.warn({ node: node.name, status: response.status }, 'Ollama node returned error')
          continue
        }

        const data = (await response.json()) as {
          message: { content: string }
          model: string
          prompt_eval_count?: number
          eval_count?: number
        }

        return {
          id: `ollama-${node.name}-${Date.now()}`,
          content: data.message.content,
          model: data.model,
          usage: {
            prompt_tokens: data.prompt_eval_count ?? 0,
            completion_tokens: data.eval_count ?? 0,
            total_tokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
          },
        }
      } catch (error) {
        logger.warn({ node: node.name, error }, 'Ollama node failed, trying next')
        continue
      }
    }

    throw new ProviderError(`No Ollama node has model ${model}`, 'PROVIDER_REQUEST_FAILED')
  }

  async isAvailable(): Promise<boolean> {
    for (const node of this.nodes) {
      try {
        const response = await fetch(`${node.url}/api/tags`, { signal: AbortSignal.timeout(3000) })
        if (response.ok) return true
      } catch {
        continue
      }
    }
    return false
  }

  async listModels(): Promise<{ node: string; models: string[] }[]> {
    const results: { node: string; models: string[] }[] = []
    for (const node of this.nodes) {
      try {
        const response = await fetch(`${node.url}/api/tags`, { signal: AbortSignal.timeout(3000) })
        if (response.ok) {
          const data = (await response.json()) as { models: { name: string }[] }
          results.push({ node: node.name, models: data.models.map((m) => m.name) })
        }
      } catch {
        results.push({ node: node.name, models: [] })
      }
    }
    return results
  }

  private async nodeHasModel(node: OllamaNode, model: string): Promise<boolean> {
    try {
      const response = await fetch(`${node.url}/api/tags`, { signal: AbortSignal.timeout(3000) })
      if (!response.ok) return false
      const data = (await response.json()) as { models: { name: string }[] }
      return data.models.some((m) => m.name === model || m.name.startsWith(model.split(':')[0]))
    } catch {
      return false
    }
  }
}
