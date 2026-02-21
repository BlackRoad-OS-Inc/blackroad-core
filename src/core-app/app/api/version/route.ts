import { NextResponse } from 'next/server'

export async function GET() {
  const serviceName = process.env.SERVICE_NAME || 'blackroad-service'
  const version = process.env.SERVICE_VERSION || '0.0.1'
  const environment = process.env.SERVICE_ENV || 'development'

  return NextResponse.json({
    version,
    service: serviceName,
    environment,
    node_version: process.version,
    build_time: process.env.BUILD_TIME || new Date().toISOString()
  })
}
