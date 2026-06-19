import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'htn26-nova-bank-jwt-secret-key-2026'

export async function getAuthenticatedSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // The login route signs with { id, username, fullName, role }
    // API routes expect session.userId, so we map it here
    return {
      userId: payload.id as number,
      username: payload.username as string,
      fullName: payload.fullName as string,
      role: payload.role as string
    }
  } catch {
    return null
  }
}
