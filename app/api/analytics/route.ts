import { runQuery, serviceFailure } from '@/lib/platform-db'
import { getAuthenticatedSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
    }

    // Fetch transactions for the logged-in user
    const result = await runQuery(
      `SELECT t.amount, t.description
       FROM transactions t
       WHERE t.created_by = $1`,
      [session.userId]
    )

    // Process transactions to create categories for Smart Spend
    let totalSpend = 0
    let bills = 0
    let transfers = 0
    let shopping = 0

    result.forEach((tx: any) => {
      const amt = Number(tx.amount)
      totalSpend += amt
      const desc = (tx.description || '').toLowerCase()

      if (desc.includes('bill') || desc.includes('fee')) {
        bills += amt
      } else if (desc.includes('transfer') || desc.includes('money')) {
        transfers += amt
      } else {
        shopping += amt
      }
    })

    // Fallback demo data if no transactions
    if (totalSpend === 0) {
      totalSpend = 10000
      bills = 4500
      shopping = 3500
      transfers = 2000
    }

    const categories = [
      { name: 'Shopping', percentage: Math.round((shopping / totalSpend) * 100), amount: shopping, color: '#8B5CF6' },
      { name: 'Bills', percentage: Math.round((bills / totalSpend) * 100), amount: bills, color: '#3B82F6' },
      { name: 'Transfer', percentage: Math.round((transfers / totalSpend) * 100), amount: transfers, color: '#10B981' },
    ]

    return Response.json({
      ok: true,
      note: 'Analytics prepared.',
      totalSpend,
      categories,
      monthlyProgress: { current: totalSpend, target: 20000 },
      savingsGoal: { current: 50000, target: 100000 },
      spendAlerts: [
        { category: 'Shopping', current: shopping, threshold: 4000, isAlert: shopping > 4000 * 0.8 },
        { category: 'Bills', current: bills, threshold: 5000, isAlert: bills > 5000 * 0.8 }
      ]
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
