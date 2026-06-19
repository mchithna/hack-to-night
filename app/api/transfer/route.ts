import { asText, pool, serviceFailure } from '@/lib/platform-db'
import { getAuthenticatedSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const fromAccount = asText(body.fromAccount || body.from)
    const toAccount = asText(body.toAccount || body.to)
    const amountStr = asText(body.amount)
    const amount = parseFloat(amountStr)
    const description = asText(body.description)

    if (!fromAccount || !toAccount || isNaN(amount) || amount <= 0) {
      return Response.json({ ok: false, message: 'Invalid transfer details.' }, { status: 400 })
    }

    if (fromAccount === toAccount) {
      return Response.json({ ok: false, message: 'Cannot transfer to the same account.' }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Verify ownership and balance of the source account
      const fromRes = await client.query(
        `SELECT id, balance FROM accounts WHERE account_number = $1 AND user_id = $2 FOR UPDATE`,
        [fromAccount, session.userId]
      )
      
      const sourceAccount = fromRes.rows[0]
      if (!sourceAccount) {
        throw new Error('Source account not found or unauthorized.')
      }
      if (parseFloat(sourceAccount.balance) < amount) {
        throw new Error('Insufficient balance.')
      }

      // Verify destination account exists
      const toRes = await client.query(
        `SELECT id FROM accounts WHERE account_number = $1 FOR UPDATE`,
        [toAccount]
      )
      if (!toRes.rows[0]) {
        throw new Error('Destination account not found.')
      }

      // Perform deduction and addition
      await client.query(
        `UPDATE accounts SET balance = balance - $1 WHERE account_number = $2`,
        [amount, fromAccount]
      )
      await client.query(
        `UPDATE accounts SET balance = balance + $1 WHERE account_number = $2`,
        [amount, toAccount]
      )

      // Log transaction
      const inserted = await client.query(
        `INSERT INTO transactions (from_account, to_account, amount, description, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [fromAccount, toAccount, amount, description, session.userId]
      )

      await client.query('COMMIT')

      return Response.json({
        ok: true,
        message: 'Transfer accepted.',
        transaction: inserted.rows[0]
      })
    } catch (e: any) {
      await client.query('ROLLBACK')
      return Response.json({ ok: false, message: e.message || 'Transfer failed.' }, { status: 400 })
    } finally {
      client.release()
    }
  } catch (reason) {
    return serviceFailure(reason)
  }
}
