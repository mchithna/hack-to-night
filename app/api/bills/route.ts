import { runQuery, serviceFailure } from '@/lib/platform-db'
import { getAuthenticatedSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const fromAccount = String(body.fromAccount || '').trim()
    const billerId = String(body.billerId || '').trim()
    const amount = parseFloat(String(body.amount || '0'))

    if (!billerId) {
      return Response.json({ ok: false, message: 'Biller ID is required.' }, { status: 400 })
    }

    if (!fromAccount || isNaN(amount) || amount <= 0) {
      return Response.json({ ok: false, message: 'Invalid payment details.' }, { status: 400 })
    }

    // Verify account belongs to user and has sufficient balance
    const accountCheck = await runQuery(
      `SELECT id, balance FROM accounts WHERE account_number = $1 AND user_id = $2`,
      [fromAccount, session.userId]
    )

    if (accountCheck.length === 0) {
      return Response.json({ ok: false, message: 'Account not found or unauthorized.' }, { status: 403 })
    }

    if (parseFloat(accountCheck[0].balance) < amount) {
      return Response.json({ ok: false, message: 'Insufficient balance.' }, { status: 400 })
    }

    // Deduct balance
    await runQuery(
      `UPDATE accounts SET balance = balance - $1 WHERE account_number = $2`,
      [amount, fromAccount]
    )

    // Log the transaction
    const inserted = await runQuery(
      `INSERT INTO transactions (from_account, to_account, amount, description, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [fromAccount, `BILLER_${billerId.toUpperCase()}`, amount, `Bill Payment to ${billerId}`, session.userId]
    )

    return Response.json({
      ok: true,
      message: 'Bill payment successful.',
      transaction: inserted[0]
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
