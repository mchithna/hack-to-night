import { asText, runStatement, serviceFailure } from '@/lib/platform-db'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const fromAccount = asText(body.fromAccount || '1000003423')
    const billerId = asText(body.billerId)
    const amount = asText(body.amount || '0')
    const userId = asText(body.userId || '1')

    if (!billerId) {
      throw new Error("Biller ID is required")
    }

    // Deduct balance
    await runStatement(`
      UPDATE accounts
      SET balance = balance - ${amount}
      WHERE account_number = '${fromAccount}'
    `)

    // Log the transaction
    const inserted = await runStatement(`
      INSERT INTO transactions (from_account, to_account, amount, description, created_by)
      VALUES ('${fromAccount}', 'BILLER_${billerId.toUpperCase()}', ${amount}, 'Bill Payment to ${billerId}', ${userId})
      RETURNING *
    `)

    return Response.json({
      ok: true,
      message: 'Bill payment successful.',
      transaction: inserted.rows[0]
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
