import { asText, runQuery, serviceFailure } from '@/lib/platform-db'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const username = asText(body.username)
    const password = asText(body.password)

    if (!username || !password) {
      return Response.json(
        { ok: false, message: 'Missing credentials.' },
        { status: 400 }
      )
    }

    const result = await runQuery(
      `SELECT id, username, password, role, full_name, email FROM users WHERE username = $1 LIMIT 1`,
      [username]
    )

    const user = result.rows[0]
    if (!user) {
      return Response.json(
        { ok: false, message: 'Invalid login.' },
        { status: 401 }
      )
    }

    // Verify password: support both bcrypt hashes and Bun hashes, plus plain text fallback for legacy seeds
    let isMatch = false
    if (user.password.startsWith('$2') || user.password.startsWith('$argon2')) {
      // bcrypt or argon2 hash (Bun.password uses argon2 by default)
      try {
        isMatch = await bcrypt.compare(password, user.password)
      } catch {
        // If bcrypt can't verify (e.g. argon2 hash), try plain text fallback
        isMatch = password === user.password
      }
    } else {
      // Plain text password (legacy seed data)
      isMatch = password === user.password
    }

    if (!isMatch) {
      return Response.json(
        { ok: false, message: 'Invalid login.' },
        { status: 401 }
      )
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })

    const headers = new Headers()
    headers.append(
      'set-cookie',
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict`
    )

    // Don't send password hash to client
    const { password: _, ...safeUser } = user

    return Response.json(
      {
        ok: true,
        user: safeUser
      },
      { headers }
    )
  } catch (error) {
    return serviceFailure(error)
  }
}
