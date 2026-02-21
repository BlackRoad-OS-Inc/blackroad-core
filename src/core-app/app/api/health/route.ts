import { NextResponse } from 'next/server'

export async function GET() {
  const serviceName = process.env.SERVICE_NAME || 'blackroad-service'

  return NextResponse.json({
    status: 'ok',
    service: serviceName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
}
