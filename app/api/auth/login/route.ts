import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { SignJWT } from 'jose'
import { runQuery, serviceFailure } from '@/lib/platform-db'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json().catch(() => ({}))

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, message: 'Username and password are required.' },
        { status: 400 }
      )
    }

    // Find user using parameterized query
    const users = await runQuery(
      'SELECT id, username, password, full_name, role FROM users WHERE username = $1 LIMIT 1',
      [username]
    )

    if (users.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Invalid credentials.' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Verify password, fallback for seed plain text passwords
    let isMatch = false
    if (
      user.password.startsWith('$2b$') ||
      user.password.startsWith('$2a$') ||
      user.password.startsWith('$2y$')
    ) {
      isMatch = await bcrypt.compare(password, user.password)
    } else {
      isMatch = password === user.password
    }

    if (!isMatch) {
      return NextResponse.json(
        { ok: false, message: 'Invalid credentials.' },
        { status: 401 }
      )
    }

    // Create JWT
    const secretValue = process.env.JWT_SECRET
    if (!secretValue) {
      return NextResponse.json(
        { ok: false, message: 'Server authentication is not configured.' },
        { status: 500 }
      )
    }

    const secret = new TextEncoder().encode(secretValue)
    
    const alg = 'HS256'
    
    const jwt = await new SignJWT({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    const response = NextResponse.json({
      ok: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role
      }
    })

    response.cookies.set('auth_token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response

  } catch (error) {
    return serviceFailure(error)
  }
}
