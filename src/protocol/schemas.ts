// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import { z } from 'zod'

export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
})

export const ChatRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(MessageSchema).min(1),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional().default(false),
})

export const UsageSchema = z.object({
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
})

export const ChatResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  model: z.string(),
  provider: z.string(),
  usage: UsageSchema,
})

export const InvokeRequestSchema = z.object({
  agent: z.string(),
  task: z.string(),
  intent: z.string().optional(),
  context: z.record(z.unknown()).optional(),
})

export const AgentSchema = z.object({
  name: z.string(),
  title: z.string(),
  role: z.string(),
  status: z.enum(['available', 'busy', 'unavailable']),
  providers: z.array(z.string()),
  capabilities: z.array(z.string()),
})

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    status: z.number(),
  }),
})

export type Message = z.infer<typeof MessageSchema>
export type ChatRequest = z.infer<typeof ChatRequestSchema>
export type ChatResponse = z.infer<typeof ChatResponseSchema>
export type InvokeRequest = z.infer<typeof InvokeRequestSchema>
export type Usage = z.infer<typeof UsageSchema>
