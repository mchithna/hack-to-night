import { asText, runStatement, serviceFailure } from '@/lib/platform-db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = asText(searchParams.get('userId') || '1')

    // Fetch transactions for the user
    const sql = `
      SELECT amount, description
      FROM transactions 
      WHERE created_by = ${userId}
    `
    const result = await runStatement(sql)
    
    // Process transactions to create mock categories for Smart Spend
    let totalSpend = 0
    let bills = 0
    let transfers = 0
    let shopping = 0

    result.rows.forEach(tx => {
      const amt = Number(tx.amount)
      totalSpend += amt
      const desc = (tx.description || '').toLowerCase()
      
      if (desc.includes('bill') || desc.includes('fee')) {
        bills += amt
      } else if (desc.includes('transfer') || desc.includes('money')) {
        transfers += amt
      } else {
        shopping += amt // default fallback
      }
    })
    
    // Fallback if no transactions exist for demo purposes
    if (totalSpend === 0) {
      totalSpend = 10000
      bills = 4500
      shopping = 3500
      transfers = 2000
    }

    const categories = [
      { name: 'Shopping', percentage: Math.round((shopping / totalSpend) * 100), amount: shopping },
      { name: 'Bills', percentage: Math.round((bills / totalSpend) * 100), amount: bills },
      { name: 'Transfer', percentage: Math.round((transfers / totalSpend) * 100), amount: transfers },
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
