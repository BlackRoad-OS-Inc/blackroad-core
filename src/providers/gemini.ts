// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { Provider, ProviderChatRequest, ProviderChatResponse } from './types.js'
import { ProviderError } from '../protocol/errors.js'

export class GeminiProvider implements Provider {
  readonly name = 'gemini'

  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  async chat(request: ProviderChatRequest): Promise<ProviderChatResponse> {
    const model = request.model || 'gemini-2.0-flash'
    const url = `${this.baseUrl}/v1beta/models/${model}:generateContent?key=${this.apiKey}`

    const contents = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const systemInstruction = request.messages.find((m) => m.role === 'system')

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction.content }] }
          : undefined,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
        },
      }),
    })

    if (!response.ok) {
      throw new ProviderError(`Gemini API error: ${response.status}`, 'PROVIDER_REQUEST_FAILED')
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }
    }

    const text = data.candidates[0]?.content.parts[0]?.text ?? ''
    const usage = data.usageMetadata

    return {
      id: `gemini-${Date.now()}`,
      content: text,
      model,
      usage: {
        prompt_tokens: usage?.promptTokenCount ?? 0,
        completion_tokens: usage?.candidatesTokenCount ?? 0,
        total_tokens: usage?.totalTokenCount ?? 0,
      },
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false
    try {
      const response = await fetch(
        `${this.baseUrl}/v1beta/models?key=${this.apiKey}`,
      )
      return response.ok
    } catch {
      return false
    }
  }
}
