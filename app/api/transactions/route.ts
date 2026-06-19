import { asText, runQuery, serviceFailure } from '@/lib/platform-db'
import { getAuthenticatedSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const account = asText(searchParams.get('account'))
    if (!account) {
      return Response.json({ ok: false, message: 'Account required.' }, { status: 400 })
    }

    // Verify that the requested account belongs to the logged-in user
    const ownershipCheck = await runQuery(
      `SELECT id FROM accounts WHERE account_number = $1 AND user_id = $2`,
      [account, session.userId]
    )
    if (!ownershipCheck[0]) {
      return Response.json({ ok: false, message: 'Forbidden.' }, { status: 403 })
    }

    const sql = `
      SELECT *
      FROM transactions
      WHERE from_account = $1 OR to_account = $1
      ORDER BY created_at DESC
    `
    const transactions = await runQuery(sql, [account])

    return Response.json({
      ok: true,
      account,
      transactions
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
