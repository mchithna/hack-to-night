import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { runQuery } from '@/lib/platform-db'

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { ok: false, message: 'Email and new password are required.' },
        { status: 400 }
      )
    }

    // Mock OTP logic: accept any non-empty OTP for now
    if (!otp) {
      return NextResponse.json(
        { ok: false, message: 'OTP is required.' },
        { status: 400 }
      )
    }

    // Check if email exists
    const users = await runQuery('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
    if (users.rows.length === 0) {
      // Return success anyway to prevent email enumeration, or return error for UX
      return NextResponse.json(
        { ok: false, message: 'Invalid request or email not found.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await runQuery('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email])

    return NextResponse.json({ ok: true, message: 'Password reset successfully.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
