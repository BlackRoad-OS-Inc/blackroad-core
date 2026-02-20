// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { Provider, ProviderChatRequest, ProviderChatResponse } from './types.js'
import { ProviderError } from '../protocol/errors.js'

export class AnthropicProvider implements Provider {
  readonly name = 'anthropic'

  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  async chat(request: ProviderChatRequest): Promise<ProviderChatResponse> {
    const systemMessage = request.messages.find((m) => m.role === 'system')
    const nonSystemMessages = request.messages.filter((m) => m.role !== 'system')

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model || 'claude-sonnet-4-20250514',
        max_tokens: request.maxTokens ?? 1024,
        system: systemMessage?.content,
        messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
        temperature: request.temperature,
      }),
    })

    if (!response.ok) {
      throw new ProviderError(`Anthropic API error: ${response.status}`, 'PROVIDER_REQUEST_FAILED')
    }

    const data = (await response.json()) as {
      id: string
      content: Array<{ text: string }>
      model: string
      usage: { input_tokens: number; output_tokens: number }
    }

    return {
      id: data.id,
      content: data.content[0]?.text ?? '',
      model: data.model,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false
    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
      })
      return response.ok || response.status === 429
    } catch {
      return false
    }
  }
}
