import { runQuery, serviceFailure } from '@/lib/platform-db'
import { getAuthenticatedSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const userId = session.userId

    // Only allow fetching accounts belonging to the authenticated user.
    // Explicitly exclude the 'pin' column from the select to prevent leaks.
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
    const body = await request.json().catch(() => ({}))
    const userId = asText(body.userId || '1')
    const accountNumber = asText(body.accountNumber)
    const accountName = asText(body.accountName)
    const balance = 0

    if (!accountNumber || !accountName) {
      throw new Error("Missing required fields")
    }

    const inserted = await runStatement(`
      INSERT INTO accounts (user_id, account_number, account_name, balance, pin)
      VALUES (${userId}, '${accountNumber}', '${accountName}', ${balance}, '1234')
      RETURNING *
    `)

    return Response.json({ ok: true, account: inserted.rows[0] })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const accountNumber = asText(body.accountNumber)
    const accountName = asText(body.accountName)

    if (!accountNumber || !accountName) {
      throw new Error("Missing required fields")
    }

    const updated = await runStatement(`
      UPDATE accounts
      SET account_name = '${accountName}'
      WHERE account_number = '${accountNumber}'
      RETURNING *
    `)

    return Response.json({ ok: true, account: updated.rows[0] })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountNumber = asText(searchParams.get('accountNumber'))

    if (!accountNumber) {
      throw new Error("Missing account number")
    }

    await runStatement(`
      DELETE FROM accounts
      WHERE account_number = '${accountNumber}'
    `)

    return Response.json({ ok: true })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
