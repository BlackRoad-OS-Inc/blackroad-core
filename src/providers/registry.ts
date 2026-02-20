// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import type { Provider } from './types.js'

export class ProviderRegistry {
  private providers = new Map<string, Provider>()

  register(provider: Provider): void {
    this.providers.set(provider.name, provider)
  }

  get(name: string): Provider | undefined {
    return this.providers.get(name)
  }

  list(): Provider[] {
    return [...this.providers.values()]
  }

  has(name: string): boolean {
    return this.providers.has(name)
  }
}

export function createProviderRegistry(): ProviderRegistry {
  return new ProviderRegistry()
}
