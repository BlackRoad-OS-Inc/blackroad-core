// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { Message, Usage } from '../protocol/schemas.js'

export interface ProviderChatRequest {
  model: string
  messages: Message[]
  temperature?: number
  maxTokens?: number
}

export interface ProviderChatResponse {
  id: string
  content: string
  model: string
  usage: Usage
}

export interface Provider {
  readonly name: string
  chat(request: ProviderChatRequest): Promise<ProviderChatResponse>
  isAvailable(): Promise<boolean>
}
