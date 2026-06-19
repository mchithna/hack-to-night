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
