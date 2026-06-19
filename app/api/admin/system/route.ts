import { runQuery, serviceFailure } from '@/lib/platform-db'
import { getAuthenticatedSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session || session.role !== 'admin') {
      return Response.json({ ok: false, message: 'Forbidden. Admin access required.' }, { status: 403 })
    }

    const users = await runQuery('SELECT id, username, role, full_name, email, created_at FROM users ORDER BY id')
    const accounts = await runQuery('SELECT id, user_id, account_number, account_name, balance FROM accounts ORDER BY id')
    const logs = await runQuery('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 10')

    return Response.json({
      ok: true,
      message: 'System overview.',
      users,
      accounts,
      auditLogs: logs
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
