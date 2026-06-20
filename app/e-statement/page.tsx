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
    <div className="min-h-screen bg-bg-light font-geist p-0 overflow-x-hidden">
      <Toaster position="top-right" />
      <div className="flex min-h-screen">
        <div className="print:hidden z-50 relative"><Sidebar /></div>

        <main className="flex-1 p-6 md:p-12 text-black print:p-0 relative">
          
          {/* Header */}
          <div className="mb-8 flex items-center justify-between print:hidden animate-fade-in-down">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-[#9a5c97]">
              E-Statement
            </h2>
            <div className="flex items-center gap-4">
              <button className="topbar-icon hover:bg-white/50 backdrop-blur-sm shadow-sm" aria-label="search">
                <img src="/search.png" alt="search" />
              </button>
              <button className="topbar-icon hover:bg-white/50 backdrop-blur-sm shadow-sm" aria-label="notifications">
                <img src="/notification.png" alt="notifications" />
              </button>
              <div className="size-12 overflow-hidden rounded-full border-2 border-white shadow-md hover:scale-105 transition-transform cursor-pointer">
                <img
                  src="/avatar.png"
                  alt="avatar"
                  className="size-full bg-white object-cover"
                />
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="w-full h-48 md:h-64 rounded-3xl overflow-hidden mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative print:hidden animate-fade-in-up stagger-1">
            <img 
              src="/estatement-banner.png" 
              alt="E-Statement Banner" 
              className="w-full h-full object-cover animate-float"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <h3 className="text-white text-2xl font-bold tracking-wide shadow-black drop-shadow-md">Your Financial Overview</h3>
            </div>
          </div>

          {/* Form */}
          <form 
            onSubmit={handleGenerateStatement} 
            className="relative z-10 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 px-8 py-8 text-black shadow-[0_10px_40px_rgba(154,92,151,0.15)] flex flex-wrap gap-6 items-end print:hidden animate-fade-in-up stagger-2 hover-lift"
          >
            <label className="flex flex-col gap-3 flex-1 min-w-[280px]">
              <span className="text-sm font-bold tracking-wider text-gray-500 uppercase">Select Account</span>
              <div className="relative">
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  disabled={loadingAccounts}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-4 text-lg font-medium text-black outline-none transition-all hover:bg-gray-100 focus:border-[#9a5c97] focus:ring-4 focus:ring-[#9a5c97]/10"
                >
                  {loadingAccounts ? <option>Loading accounts...</option> : accounts.map(a => (
                    <option key={a.account_number} value={a.account_number}>
                      {a.account_number} — {a.account_name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </label>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-8 py-4 bg-gradient-to-r from-[#b886b6] to-[#9b5f90] text-white rounded-xl font-bold shadow-[0_10px_20px_rgba(154,92,151,0.3)] transition-all hover:translate-y-[-2px] hover:shadow-[0_15px_25px_rgba(154,92,151,0.4)] active:translate-y-[1px] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[200px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </div>
              ) : "Generate Statement"}
            </button>
          </form>

          {/* Action Buttons */}
          {statementData && (
            <div className="flex justify-end mt-8 print:hidden animate-fade-in stagger-3">
              <button 
                onClick={() => window.print()} 
                className="px-6 py-3 bg-white text-[#9a5c97] border-2 border-[#9a5c97] rounded-full font-bold transition-all hover:bg-[#9a5c97] hover:text-white flex items-center gap-2 shadow-[0_8px_16px_rgba(154,92,151,0.15)] hover-lift"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download PDF
              </button>
            </div>
          )}

          {/* Statement Document Preview */}
          {statementData && (
            <section
              aria-label="Bank statement preview"
              className="mt-6 mb-16 min-h-[800px] bg-white rounded-3xl p-10 text-black shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 print:shadow-none print:border-none print:rounded-none print:p-0 print:mt-0 animate-fade-in-up stagger-4"
            >
              <div className="max-w-full relative">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8">
                  <div>
                    <img
                      src="/loginlogo.png"
                      alt="Nova Bank"
                      className="h-16 w-auto object-contain"
                    />
                    <h2 className="mt-4 text-3xl font-black text-[#450043] tracking-tight">Statement of Account</h2>
                  </div>
                  <div className="text-right text-sm text-gray-500 leading-relaxed">
                    <p className="font-bold text-gray-800">Nova Bank Head Office</p>
                    <p>123 Finance Avenue</p>
                    <p>Colombo 01, Sri Lanka</p>
                    <p>+94 11 234 5678</p>
                  </div>
                </div>

                {/* Account Details */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-4">Account Information</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Account Holder</dt>
                        <dd className="font-bold text-gray-900">{statementData.accountHolder}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Account Number</dt>
                        <dd className="font-mono font-bold text-gray-900">{selectedAccount}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Currency</dt>
                        <dd className="font-bold text-gray-900">LKR (Rs.)</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-4">Statement Details</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Statement Date</dt>
                        <dd className="font-medium text-gray-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Period</dt>
                        <dd className="font-medium text-gray-900">All Time</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="mt-10">
                  <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-4">Summary</h3>
                  <div className="bg-gradient-to-r from-[#450043] to-[#9a5c97] rounded-2xl overflow-hidden shadow-lg print:bg-white print:border print:border-gray-300">
                    <table className="w-full text-left text-white print:text-black">
                      <thead>
                        <tr className="bg-black/20 print:bg-gray-100">
                          <th className="p-5 font-semibold text-sm">Opening Balance</th>
                          <th className="p-5 font-semibold text-sm">Total Credits (+)</th>
                          <th className="p-5 font-semibold text-sm">Total Debits (-)</th>
                          <th className="p-5 font-bold text-sm bg-black/30 print:bg-gray-200">Closing Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-5 font-medium">Rs. {statementData.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-5 font-medium text-green-300 print:text-green-700">+Rs. {statementData.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-5 font-medium text-red-300 print:text-red-700">-Rs. {statementData.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-5 font-bold text-xl bg-black/20 print:bg-gray-100">Rs. {statementData.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="mt-12">
                  <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-4">Transaction History</h3>

                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                          <th className="w-[12%] p-4">Date</th>
                          <th className="w-[24%] p-4">Description</th>
                          <th className="w-[16%] p-4">Reference</th>
                          <th className="w-[16%] p-4 text-right">Debit (-)</th>
                          <th className="w-[16%] p-4 text-right">Credit (+)</th>
                          <th className="w-[16%] p-4 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.length === 0 ? (
                          <tr>
                            <td className="p-8 text-center text-gray-400 italic bg-gray-50/50" colSpan={6}>No transactions found for this period.</td>
                          </tr>
                        ) : (
                          (() => {
                            let runningBalance = statementData.closingBalance
                            return transactions.map((tx, idx) => {
                              const isCredit = tx.to_account === selectedAccount || (tx.from_account !== selectedAccount && Number(tx.amount) > 0)
                              const amount = Math.abs(Number(tx.amount))
                              const balAtTime = runningBalance

                              if (isCredit) {
                                runningBalance -= amount
                              } else {
                                runningBalance += amount
                              }

                              return (
                                <tr key={tx.id || idx} className="hover:bg-purple-50/50 transition-colors group">
                                  <td className="p-4 text-gray-600 font-medium">
                                    {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                  </td>
                                  <td className="p-4 font-medium text-gray-900">
                                    {tx.description || (isCredit ? 'Deposit' : 'Withdrawal')}
                                  </td>
                                  <td className="p-4 font-mono text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                                    {tx.id || 'N/A'}
                                  </td>
                                  <td className="p-4 text-right text-red-600 font-medium">
                                    {!isCredit ? `${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                                  </td>
                                  <td className="p-4 text-right text-green-600 font-medium">
                                    {isCredit ? `${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                                  </td>
                                  <td className="p-4 text-right font-bold text-gray-900">
                                    {balAtTime.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              )
                            })
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-12 text-center text-xs text-gray-400 print:block">
                  <p>This is a computer-generated statement and does not require a signature.</p>
                  <p>© {new Date().getFullYear()} Nova Bank. All rights reserved.</p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}