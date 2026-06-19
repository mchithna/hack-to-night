import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { runQuery } from '@/lib/platform-db'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, fullName } = await req.json()

    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { ok: false, message: 'All fields are required.' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await runQuery(
      'SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1',
      [username, email]
    )

    if (existingUser.length > 0) {
      return NextResponse.json(
        { ok: false, message: 'Username or email already exists.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user
    const userResult = await runQuery(
      'INSERT INTO users (username, email, password, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, email, hashedPassword, fullName, 'customer']
    )

    const userId = userResult[0].id

    // Generate a random 10-digit account number (retry on collision)
    let accountNumber: string | null = null

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = Math.floor(1000000000 + Math.random() * 9000000000).toString()
      const inserted = await runQuery<{ account_number: string }>(
        'INSERT INTO accounts (user_id, account_number, account_name, balance) VALUES ($1, $2, $3, $4) ON CONFLICT (account_number) DO NOTHING RETURNING account_number',
        [userId, candidate, 'Main Savings', 0]
      )

      if (inserted.length > 0) {
        accountNumber = inserted[0].account_number
        break
      }
    }

    if (!accountNumber) {
      return NextResponse.json(
        { ok: false, message: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, message: 'User registered successfully.' })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
