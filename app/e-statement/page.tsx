'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import { Toaster, toast } from 'react-hot-toast'

type Transaction = {
  id: string
  created_at: string
  amount: number
  description: string
  from_account: string
  to_account: string
}

type Account = {
  account_number: string
  account_name: string
  balance: number
  username: string
  full_name: string
}

export default function EStatementPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [statementData, setStatementData] = useState<{
    openingBalance: number
    totalCredits: number
    totalDebits: number
    closingBalance: number
    accountHolder: string
  } | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/accounts')
        if (res.ok) {
          const data = await res.json()
          setAccounts(data.accounts || [])
          if (data.accounts && data.accounts.length > 0) {
            setSelectedAccount(data.accounts[0].account_number)
          }
        }
      } catch (err) {
        toast.error("Failed to fetch accounts")
      } finally {
        setLoadingAccounts(false)
      }
    }
    fetchAccounts()
  }, [])

  const handleGenerateStatement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return

    setLoading(true)
    const loadToast = toast.loading("Generating Statement...")

    try {
      const currentAccount = accounts.find(a => a.account_number === selectedAccount)
      const res = await fetch(`/api/transactions?account=${selectedAccount}`)
      
      if (res.ok) {
        const data = await res.json()
        const txs: Transaction[] = data.transactions || []
        
        let totalCredits = 0
        let totalDebits = 0

        // Calculate based on the perspective of the selected account
        txs.forEach(tx => {
          if (tx.to_account === selectedAccount || (tx.from_account !== selectedAccount && Number(tx.amount) > 0)) {
            totalCredits += Math.abs(Number(tx.amount))
          } else {
            totalDebits += Math.abs(Number(tx.amount))
          }
        })

        const closingBalance = currentAccount ? Number(currentAccount.balance) : 0
        const openingBalance = closingBalance - totalCredits + totalDebits

        setTransactions(txs)
        setStatementData({
          openingBalance,
          totalCredits,
          totalDebits,
          closingBalance,
          accountHolder: currentAccount?.full_name || currentAccount?.username || 'User'
        })
        
        toast.success("Statement generated")
      } else {
        toast.error("Failed to load transactions")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      toast.dismiss(loadToast)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light font-geist p-0">
      <Toaster position="top-right" />
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 p-12 text-black">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">E-Statement</h2>
            <div className="flex items-center gap-3">
              <button className="topbar-icon" aria-label="search">
                <img src="/search.png" alt="search" />
              </button>
              <button className="topbar-icon" aria-label="notifications">
                <img src="/notification.png" alt="notifications" />
              </button>
              <div className="size-12 overflow-hidden rounded-full border-2 border-gray-200">
                <img
                  src="/avatar.png"
                  alt="avatar"
                  className="size-full bg-white object-cover"
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerateStatement} className="rounded-[32px] bg-white px-10 py-8 text-black shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] flex flex-wrap gap-6 items-end">
            <label className="flex flex-col gap-2 text-xl md:flex-row md:items-center">
              <span>Select account number:</span>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                disabled={loadingAccounts}
                className="min-w-0 border-0 border-b border-black bg-transparent px-2 py-1 text-xl text-black outline-none"
              >
                {loadingAccounts ? <option>Loading...</option> : accounts.map(a => (
                  <option key={a.account_number} value={a.account_number}>
                    {a.account_number} - {a.account_name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-black text-white rounded-full font-medium transition hover:bg-gray-800 disabled:opacity-50">
              {loading ? "Generating..." : "Generate Statement"}
            </button>
          </form>

          {statementData && (
            <section
              aria-label="Bank statement preview"
              className="mt-6 min-h-[560px] bg-[#e7e7e7] px-7 py-9 text-black shadow-inner"
            >
              <div className="max-w-full">
                <img
                  src="/loginlogo.png"
                  alt="Nova Bank"
                  className="size-[86px] rounded-full object-cover"
                />

                <div className="mt-5 text-sm leading-tight">
                  <h2 className="font-bold">Bank Statement</h2>
                  <dl>
                    <div>
                      <dt className="inline">Account Holder: </dt>
                      <dd className="inline font-medium">{statementData.accountHolder}</dd>
                    </div>
                    <div>
                      <dt className="inline">Account Number: </dt>
                      <dd className="inline font-medium">{selectedAccount}</dd>
                    </div>
                    <div>
                      <dt className="inline">Statement Date: </dt>
                      <dd className="inline font-medium">{new Date().toLocaleDateString()}</dd>
                    </div>
                    <div>
                      <dt className="inline">Branch: </dt>
                      <dd className="inline font-medium">Head Office</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-9 text-sm">
                  <h3 className="font-bold">Account Summary</h3>
                  <table className="mt-4 w-full table-fixed border-collapse text-left bg-white shadow-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="p-3 font-semibold">Opening Balance</th>
                        <th className="p-3 font-semibold text-green-700">Total Credits</th>
                        <th className="p-3 font-semibold text-red-700">Total Debits</th>
                        <th className="p-3 font-semibold">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3">Rs. {statementData.openingBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="p-3 text-green-700">+Rs. {statementData.totalCredits.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="p-3 text-red-700">-Rs. {statementData.totalDebits.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="p-3 font-bold">Rs. {statementData.closingBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-10 border-t border-black pt-9">
                  <h3 className="text-sm font-bold mb-4">Transaction Details</h3>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-sm bg-white shadow-sm">
                      <thead>
                        <tr className="border-b-2 border-black">
                          <th className="w-[13%] p-3 font-semibold">Date</th>
                          <th className="w-[22%] p-3 font-semibold">Description</th>
                          <th className="w-[18%] p-3 font-semibold">Reference ID</th>
                          <th className="w-[15%] p-3 font-semibold text-red-700">Debit(-)</th>
                          <th className="w-[16%] p-3 font-semibold text-green-700">Credit(+)</th>
                          <th className="w-[16%] p-3 font-semibold">Balance After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.length === 0 ? (
                          <tr>
                            <td className="p-6 text-center text-gray-500 italic" colSpan={6}>No transactions found for this period.</td>
                          </tr>
                        ) : (
                          // We map transactions backwards to calculate running balance if we assume they are sorted by date desc
                          // Actually, a true running balance from bottom to top:
                          (() => {
                            let runningBalance = statementData.closingBalance
                            return transactions.map((tx, idx) => {
                              const isCredit = tx.to_account === selectedAccount || (tx.from_account !== selectedAccount && Number(tx.amount) > 0)
                              const amount = Math.abs(Number(tx.amount))
                              const balAtTime = runningBalance

                              // Adjust running balance for next (older) transaction
                              if (isCredit) {
                                runningBalance -= amount
                              } else {
                                runningBalance += amount
                              }

                              return (
                                <tr key={tx.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="p-3">{new Date(tx.created_at).toLocaleDateString()}</td>
                                  <td className="p-3">{tx.description || (isCredit ? 'Deposit' : 'Withdrawal')}</td>
                                  <td className="p-3 font-mono text-xs">{tx.id || 'N/A'}</td>
                                  <td className="p-3 text-red-600">{!isCredit ? `Rs. ${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}</td>
                                  <td className="p-3 text-green-600">{isCredit ? `Rs. ${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}</td>
                                  <td className="p-3 font-medium">Rs. {balAtTime.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                              )
                            })
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
