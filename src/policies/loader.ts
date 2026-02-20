// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PolicyConfig } from './types.js'

export function loadPolicies(configDir: string): PolicyConfig {
  const filePath = resolve(configDir, 'agent-permissions.json')
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as PolicyConfig
}
