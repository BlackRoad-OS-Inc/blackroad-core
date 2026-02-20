// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { Message } from '../protocol/schemas.js'
import type { SystemPrompts } from './loader.js'

export class PromptBuilder {
  constructor(private systemPrompts: SystemPrompts) {}

  build(agentName: string, userMessages: Message[]): Message[] {
    const systemPrompt = this.systemPrompts[agentName] ?? ''

    const messages: Message[] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push(...userMessages)

    return messages
  }
}
