// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { Provider, ProviderChatRequest, ProviderChatResponse } from './types.js'
import { ProviderError } from '../protocol/errors.js'

export class OllamaProvider implements Provider {
  readonly name = 'ollama'

  constructor(private baseUrl: string) {}

  async chat(request: ProviderChatRequest): Promise<ProviderChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model || 'qwen2.5:7b',
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
        options: { temperature: request.temperature, num_predict: request.maxTokens },
      }),
    })

    if (!response.ok) {
      throw new ProviderError(`Ollama API error: ${response.status}`, 'PROVIDER_REQUEST_FAILED')
    }

    const data = (await response.json()) as {
      message: { content: string }
      model: string
      prompt_eval_count?: number
      eval_count?: number
    }

    const promptTokens = data.prompt_eval_count ?? 0
    const completionTokens = data.eval_count ?? 0

    return {
      id: `ollama-${Date.now()}`,
      content: data.message.content,
      model: data.model,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }
}
