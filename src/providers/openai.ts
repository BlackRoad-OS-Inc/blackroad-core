// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { Provider, ProviderChatRequest, ProviderChatResponse } from './types.js'
import { ProviderError } from '../protocol/errors.js'

export class OpenAIProvider implements Provider {
  readonly name = 'openai'

  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  async chat(request: ProviderChatRequest): Promise<ProviderChatResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4o',
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new ProviderError(`OpenAI API error: ${response.status}`, 'PROVIDER_REQUEST_FAILED')
    }

    const data = (await response.json()) as {
      id: string
      choices: Array<{ message: { content: string } }>
      model: string
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
    }

    return {
      id: data.id,
      content: data.choices[0]?.message.content ?? '',
      model: data.model,
      usage: {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      },
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
