# CLAUDE.md - blackroad-core

Core orchestration layer and tokenless gateway for BlackRoad OS.

## Stack

Node.js 22 / TypeScript 5 / Hono / Zod / Vitest

## Commands

- `npm run dev` — Start dev server with hot reload
- `npm run build` — Compile TypeScript
- `npm run test` — Run tests
- `npm run typecheck` — Type check without emitting
- `npm run lint` — ESLint

## Architecture

- `src/gateway/` — HTTP server, middleware, routes
- `src/providers/` — AI provider adapters (Anthropic, OpenAI, Ollama, Gemini)
- `src/policies/` — Permission engine, policy loading
- `src/protocol/` — Request/response schemas (Zod)
- `src/agents/` — Agent registry and invocation
- `src/prompts/` — System prompt loading and context building
- `src/telemetry/` — Metrics and structured logging

## Key Principle

TOKENLESS: Agents never hold API keys. All provider communication goes through this gateway.
