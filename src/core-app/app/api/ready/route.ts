import { NextResponse } from 'next/server'

export async function GET() {
  // Add any readiness checks here (database connections, external services, etc.)
  const isReady = true

  if (!isReady) {
    return NextResponse.json(
      { ready: false, reason: 'Service dependencies not available' },
      { status: 503 }
    )
  }

  return NextResponse.json({
    ready: true,
    service: process.env.SERVICE_NAME || 'blackroad-service'
  })
}
