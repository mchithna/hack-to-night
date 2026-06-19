import { runQuery, serviceFailure } from '@/lib/platform-db'
import { getAuthenticatedSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const userId = session.userId

    const sql = `
      SELECT a.id, a.user_id, a.account_number, a.account_name, a.balance, u.username, u.full_name
      FROM accounts a
      JOIN users u ON u.id = a.user_id
      WHERE a.user_id = $1
      ORDER BY a.id
    `
    const accounts = await runQuery(sql, [userId])

    return Response.json({
      ok: true,
      note: 'Account list prepared.',
      accounts
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const accountNumber = String(body.accountNumber || '').trim()
    const accountName = String(body.accountName || '').trim()

    if (!accountNumber || !accountName) {
      return Response.json({ ok: false, message: 'Missing required fields.' }, { status: 400 })
    }

    const inserted = await runQuery(
      `INSERT INTO accounts (user_id, account_number, account_name, balance, pin)
       VALUES ($1, $2, $3, 0, '1234') RETURNING *`,
      [session.userId, accountNumber, accountName]
    )

    return Response.json({ ok: true, account: inserted[0] })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const accountNumber = String(body.accountNumber || '').trim()
    const accountName = String(body.accountName || '').trim()

    if (!accountNumber || !accountName) {
      return Response.json({ ok: false, message: 'Missing required fields.' }, { status: 400 })
    }

    const updated = await runQuery(
      `UPDATE accounts SET account_name = $1
       WHERE account_number = $2 AND user_id = $3
       RETURNING *`,
      [accountName, accountNumber, session.userId]
    )

    if (updated.length === 0) {
      return Response.json({ ok: false, message: 'Account not found or unauthorized.' }, { status: 404 })
    }

    return Response.json({ ok: true, account: updated[0] })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountNumber = searchParams.get('accountNumber') || ''

    if (!accountNumber) {
      return Response.json({ ok: false, message: 'Missing account number.' }, { status: 400 })
    }

    const deleted = await runQuery(
      `DELETE FROM accounts WHERE account_number = $1 AND user_id = $2 RETURNING id`,
      [accountNumber, session.userId]
    )

    if (deleted.length === 0) {
      return Response.json({ ok: false, message: 'Account not found or unauthorized.' }, { status: 404 })
    }

    return Response.json({ ok: true })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
