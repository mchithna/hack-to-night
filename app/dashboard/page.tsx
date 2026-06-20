'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/sidebar'
import { Bell, ChevronRight, Search } from '../../components/Icons'
import { Toaster, toast } from 'react-hot-toast'
import Image from 'next/image'

type Account = {
  account_number: string
  balance: string | number
  type: string
}

type Transaction = {
  id: string
  created_at: string
  amount: string | number
  from_account: string
  to_account: string
  status: string
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{username: string, full_name?: string} | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payees, setPayees] = useState<{name: string, account: string}[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        // Fetch accounts
        const acctRes = await fetch('/api/accounts')
        if (acctRes.ok) {
          const acctData = await acctRes.json()
          if (acctData.accounts && acctData.accounts.length > 0) {
            // Assume user details are tied to the first account for now
            const firstAcc = acctData.accounts[0]
            setUser({ username: firstAcc.username, full_name: firstAcc.full_name })
            
            // Calculate total balance
            const totalBalance = acctData.accounts.reduce((sum: number, acc: Account) => sum + Number(acc.balance), 0)
            setBalance(totalBalance)

            // Fetch transactions for the primary account
            const transRes = await fetch(`/api/transactions?account=${firstAcc.account_number}`)
            if (transRes.ok) {
              const transData = await transRes.json()
              const fetchedTxs = transData.transactions || []
              setTransactions(fetchedTxs.slice(0, 5)) // show top 5

              // Extract unique payees (transactions where money went OUT to a different account)
              const uniquePayees = new Map()
              fetchedTxs.forEach((tx: Transaction) => {
                if (tx.from_account === firstAcc.account_number && tx.to_account && tx.to_account !== firstAcc.account_number) {
                  uniquePayees.set(tx.to_account, { name: 'Saved Payee', account: tx.to_account })
                }
              })
              setPayees(Array.from(uniquePayees.values()).slice(0, 4))
            }
          }
        } else {
          toast.error("Failed to load dashboard data.")
        }
      } catch (err) {
        console.error(err)
        toast.error("Error loading dashboard")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-bg-light font-geist p-0 overflow-x-hidden">
      <Toaster position="top-right" />
      <div className="flex min-h-screen">
        <div className="z-50 relative"><Sidebar /></div>

        <main className="flex-1 p-6 md:p-12 text-black relative">
          
          {/* Header */}
          <div className="mb-8 flex items-center justify-between animate-fade-in-down">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-[#9a5c97]">
              Dashboard
            </h2>
            <div className="flex items-center gap-6 text-gray-500">
              <Search size={22} className="cursor-pointer hover:text-purple-700 transition-colors" />
              <Bell size={22} className="cursor-pointer hover:text-purple-700 transition-colors" />
              <div className="w-11 h-11 rounded-full bg-white border-2 border-white/50 shadow-md overflow-hidden hover-lift cursor-pointer">
                <Image src="/person-logo.png" alt="Profile" width={44} height={44} className="object-cover" />
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="w-full relative rounded-3xl overflow-hidden mb-8 shadow-[0_10px_40px_rgba(154,92,151,0.2)] animate-fade-in-up stagger-1 h-[220px]">
            <Image 
              src="/dashboard-banner.png" 
              alt="Dashboard Banner" 
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-transparent flex items-center p-10">
              <div className="text-white">
                {loading ? (
                  <div className="h-8 w-64 bg-white/20 animate-pulse rounded mb-2"></div>
                ) : (
                  <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.full_name || user?.username || 'User'}!</h1>
                )}
                <p className="text-white/80">Here is your financial overview.</p>
              </div>
            </div>
          </div>

          {/* Top Section */}
          <div className="flex flex-col xl:flex-row gap-8 mb-8">
            
            {/* Balance Card */}
            <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-8 hover-lift animate-fade-in-up stagger-2 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-100/30 animate-float" />
              
              <p className="text-gray-500 font-medium mb-2">Current Balance</p>
              {loading ? (
                <div className="h-10 w-48 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400">
                  Rs. {balance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </div>
              )}
              
              <div className="mt-8 flex gap-2">
                <span className="w-12 h-1.5 bg-purple-600 rounded-full"></span>
                <span className="w-2 h-1.5 bg-purple-200 rounded-full"></span>
                <span className="w-2 h-1.5 bg-purple-200 rounded-full"></span>
              </div>
            </div>

            {/* Payees Card */}
            <div className="w-full xl:w-[320px] bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-6 hover-lift animate-fade-in-up stagger-3">
              <h3 className="font-bold text-lg mb-4 text-gray-800 text-center">Saved Payees</h3>
              <div className="space-y-4">
                {loading ? (
                  [1, 2].map(i => (
                    <div key={i} className="flex gap-3 items-center p-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 animate-pulse w-1/2 rounded"></div>
                        <div className="h-3 bg-gray-200 animate-pulse w-3/4 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : payees.length > 0 ? (
                  payees.map((payee, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-xl transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
                        <Image src="/person-logo.png" alt="user" width={40} height={40} className="object-cover" />
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-gray-800">{payee.name}</p>
                        <p className="text-gray-500">{payee.account}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No recent payees</p>
                )}
              </div>
              <div className="text-right mt-4 text-sm font-medium text-purple-700 flex justify-end items-center gap-1 cursor-pointer hover:text-purple-900">
                View all <ChevronRight size={15} />
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-8 hover-lift animate-fade-in-up stagger-4">
            <h2 className="font-bold text-xl mb-6 text-gray-800">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 font-semibold text-gray-500">Date</th>
                    <th className="pb-3 font-semibold text-gray-500">Account</th>
                    <th className="pb-3 font-semibold text-gray-500 text-right">Amount</th>
                    <th className="pb-3 font-semibold text-gray-500 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="py-4"><div className="h-4 bg-gray-200 animate-pulse w-24 rounded"></div></td>
                        <td className="py-4"><div className="h-4 bg-gray-200 animate-pulse w-32 rounded"></div></td>
                        <td className="py-4 text-right"><div className="h-4 bg-gray-200 animate-pulse w-20 rounded ml-auto"></div></td>
                        <td className="py-4 text-center"><div className="h-6 bg-gray-200 animate-pulse w-16 rounded mx-auto"></div></td>
                      </tr>
                    ))
                  ) : transactions.length > 0 ? (
                    transactions.map((t, index) => {
                      const isNegative = Number(t.amount) < 0;
                      return (
                        <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-white/40 transition-colors">
                          <td className="py-4 text-gray-600 font-medium">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-gray-800 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm bg-white flex-shrink-0">
                               <Image src="/person-logo.png" alt="user" width={32} height={32} />
                            </div>
                            {t.to_account || t.from_account}
                          </td>
                          <td className={`py-4 text-right font-bold ${isNegative ? 'text-red-500' : 'text-green-600'}`}>
                            {isNegative ? '-' : '+'}Rs. {Math.abs(Number(t.amount)).toLocaleString(undefined, {minimumFractionDigits:2})}
                          </td>
                          <td className="py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                              {t.status || 'Success'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-6 text-sm font-medium text-purple-700 flex justify-end items-center gap-1 cursor-pointer hover:text-purple-900">
              View all <ChevronRight size={15} />
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
