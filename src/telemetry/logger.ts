// Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
import pino from 'pino'

export const logger = pino({
  level: process.env.BLACKROAD_LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
})
