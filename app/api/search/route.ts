import { asText, runQuery, serviceFailure } from '@/lib/platform-db'
import { getAuthenticatedSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = asText(searchParams.get('q'))

    // Require admin for global search, or at least restrict data.
    // For now, parameterized query to prevent SQL injection.
    const wildcard = `%${q}%`
    
    const sql = `
      SELECT 'user' AS type, id::text, username AS label, email AS detail FROM users
      WHERE username ILIKE $1 OR full_name ILIKE $1
      UNION ALL
      SELECT 'account' AS type, id::text, account_number AS label, account_name AS detail FROM accounts
      WHERE account_number ILIKE $1 OR account_name ILIKE $1
      UNION ALL
      SELECT 'transaction' AS type, id::text, from_account || ' -> ' || to_account AS label, description AS detail FROM transactions
      WHERE description ILIKE $1
      LIMIT 25
    `
    const results = await runQuery(sql, [wildcard])

    return Response.json({
      ok: true,
      query: q,
      results
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
