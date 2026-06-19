import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({ ok: true, user: session })
  } catch (err) {
    console.error('Session check failed', err)
    return NextResponse.json({ ok: false, message: 'Internal error' }, { status: 500 })
  }
}
