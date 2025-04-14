import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    env: {
      appName: process.env.NEXT_PUBLIC_APP_NAME,
      authUrl: process.env.NEXTAUTH_URL,
      envStatus: process.env.NEXT_PUBLIC_APP_NAME ? 'loaded' : 'missing'
    }
  })
}
