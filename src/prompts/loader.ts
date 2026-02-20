// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface SystemPrompts {
  [agentName: string]: string
}

export function loadSystemPrompts(configDir: string): SystemPrompts {
  const filePath = resolve(configDir, 'system-prompts.json')
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as SystemPrompts
}
