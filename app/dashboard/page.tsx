'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/sidebar'
import { Bell, ChevronRight, Search } from '../../components/Icons'
import { Toaster, toast } from 'react-hot-toast'

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
    <main className="dashboard">
      <Toaster position="top-right" />
      <Sidebar />

      <section className="content page-transition">
        {/* Header */}
        <header className="content-header animate-fade-in-down">
          <h1 className="page-title">Dashboard</h1>
          <div className="header-actions">
            <Search size={24} />
            <Bell size={24} />
            <img src="/person-logo.png" alt="profile" className="avatar" />
          </div>
        </header>

        {/* Top Section */}
        <div className="top-section">
          <div className="welcome-card animate-fade-in-up stagger-1">
            {loading ? (
              <div className="skeleton h-8 w-1/2 mb-4 mt-3 ml-4 rounded"></div>
            ) : (
              <h2 className="welcome-title">Welcome back, {user?.full_name || user?.username || 'User'}!</h2>
            )}
            <div className="balance-card">
              <p className="balance-label">Current Balance</p>
              {loading ? (
                <div className="skeleton h-6 w-32 mt-2 rounded"></div>
              ) : (
                <p className="balance-amount">Rs. {balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              )}
              <ChevronRight className="balance-chevron" size={30} />
            </div>
            <div className="carousel-dots">
              <span className="dot active" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <img
              src="/Dashboard-logo.png"
              alt="woman"
              className="welcome-image"
            />
          </div>

          <div className="payees-card animate-fade-in-up stagger-2">
            <h3 className="payees-title">Saved Payees</h3>
            <div className="payees-list">
              {loading ? (
                [1, 2].map(i => (
                  <div key={i} className="flex gap-3 items-center skeleton p-2 rounded">
                    <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                    <div className="flex-1 space-y-2"><div className="h-3 bg-gray-300 w-1/2 rounded"></div><div className="h-3 bg-gray-300 w-3/4 rounded"></div></div>
                  </div>
                ))
              ) : payees.length > 0 ? (
                payees.map((payee, idx) => (
                  <div key={idx} className="payee-item">
                    <img src="/person-logo.png" alt="user" className="avatar" />
                    <div className="payee-info">
                      <p>{payee.name}</p>
                      <p>{payee.account}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center mt-4">No recent payees</p>
              )}
            </div>
            <div className="view-all">
              View all
              <ChevronRight size={15} />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="transactions-section">
          <h2 className="transactions-title">Recent Transactions</h2>
          <div className="transactions-card animate-fade-in-up stagger-3">
            {loading ? (
               [1, 2, 3].map(i => (
                <div key={i} className="transaction-item skeleton p-2 rounded mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div className="h-4 bg-gray-300 w-1/4 rounded"></div>
                  <div className="h-4 bg-gray-300 w-1/4 rounded"></div>
                </div>
               ))
            ) : transactions.length > 0 ? (
              transactions.map((t, index) => (
                <div key={index} className="transaction-item">
                  <img src="/person-logo.png" alt="user" className="avatar" />
                  <span className="transaction-date">{new Date(t.created_at).toLocaleDateString()}</span>
                  <span className="transaction-account">{t.to_account || t.from_account}</span>
                  <span className="transaction-amount" style={{color: Number(t.amount) < 0 ? 'red' : 'green'}}>
                    {Number(t.amount) < 0 ? '-' : '+'}Rs. {Math.abs(Number(t.amount)).toLocaleString(undefined, {minimumFractionDigits:2})}
                  </span>
                  <span className="transaction-status">{t.status || 'Success'}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No transactions found.</p>
            )}
            <div className="view-all">
              View all
              <ChevronRight size={15} />
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .skeleton {
          animation: pulse 1.5s infinite;
          background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
          background-size: 200% 100%;
        }
        @keyframes pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .dashboard {
          width: 100vw;
          min-height: 100vh;
          background: #f1f1f1;
          display: flex;
          gap: 1.5rem;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .content {
          flex: 1;
          padding: 1.5rem 1.25rem;
          overflow-y: auto;
          min-width: 0;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: black;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          object-fit: cover;
        }

        .top-section {
          margin-top: 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .welcome-card {
          width: 640px;
          max-width: 100%;
          height: 230px;
          background: #e7e1e8;
          border-radius: 18px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }

        .welcome-title {
          font-size: 18px;
          padding: 0.75rem 1rem 0;
          color: black;
        }

        .balance-card {
          position: absolute;
          left: 5rem;
          top: 60px;
          width: 380px;
          max-width: calc(100% - 2rem);
          height: 120px;
          background: black;
          border-radius: 14px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0 1rem;
        }

        .balance-label {
          font-size: 21px;
        }

        .balance-amount {
          color: #a7d93a;
          font-size: 20px;
          margin-top: 0.25rem;
        }

        .balance-chevron {
          position: absolute;
          right: 1rem;
        }

        .carousel-dots {
          position: absolute;
          bottom: 1.25rem;
          left: 160px;
          display: flex;
          gap: 0.5rem;
        }

        .dot {
          width: 6px;
          height: 3px;
          background: #9ca3af;
          border-radius: 2px;
        }
        .dot.active {
          width: 50px;
          background: #6060d5;
        }

        .welcome-image {
          position: absolute;
          right: 0;
          bottom: 0;
          height: 250px;
          object-fit: cover;
        }

        .payees-card {
          width: 270px;
          height: 230px;
          background: white;
          border-radius: 18px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          color: black;
          flex: 1;
          min-width: 200px;
        }

        .payees-title {
          font-weight: 600;
          text-align: center;
          font-size: 1rem;
        }

        .payees-list {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .payee-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .payee-info {
          font-size: 13px;
          line-height: 1.3;
        }
        .payee-info p:first-child {
          font-weight: 500;
        }
        .payee-info p:last-child {
          color: #4b5563;
        }

        .view-all {
          text-align: right;
          margin-top: 1rem;
          font-size: 13px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.25rem;
          cursor: default;
        }

        .transactions-section {
          margin-top: 0.75rem;
          color: black;
        }

        .transactions-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .transactions-card {
          background: white;
          border-radius: 22px;
          box-shadow: 18px 18px 12px rgba(0, 0, 0, 0.15);
          padding: 1.25rem;
          width: 1000px;
          height: 200px;
          max-width: 100%;
          overflow-x: auto;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .transaction-date,
        .transaction-account,
        .transaction-amount {
          font-size: 0.95rem;
        }

        .transaction-status {
          background: #d5f1cb;
          padding: 0.25rem 1.5rem;
          border-radius: 4px;
          color: black;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        @media (max-width: 1024px) {
          .welcome-card {
            width: 100%;
          }
          .transactions-card {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            flex-direction: column;
            gap: 0;
          }

          .content {
            padding: 1rem;
          }

          .page-title {
            font-size: 22px;
          }

          .top-section {
            flex-direction: column;
            align-items: stretch;
          }

          .welcome-card {
            height: 220px;
          }
          .balance-card {
            width: calc(100% - 2rem);
            left: 1rem;
            top: 50px;
            height: 100px;
          }
          .balance-label {
            font-size: 18px;
          }
          .balance-amount {
            font-size: 18px;
          }
          .welcome-image {
            height: 160px;
          }
          .carousel-dots {
            left: 1.5rem;
            bottom: 0.75rem;
          }

          .payees-card {
            width: 100%;
            height: auto;
            min-height: 200px;
          }

          .transactions-card {
            padding: 1rem;
          }

          .transaction-item {
            flex-wrap: wrap;
            gap: 0.5rem;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 0.75rem;
          }
          .transaction-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .transaction-status {
            padding: 0.15rem 1rem;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .header-actions {
            gap: 0.75rem;
          }
          .avatar {
            width: 35px;
            height: 35px;
          }
          .page-title {
            font-size: 20px;
          }
          .balance-label {
            font-size: 16px;
          }
          .balance-amount {
            font-size: 16px;
          }
          .welcome-card {
            height: 200px;
          }
          .welcome-image {
            height: 130px;
          }
          .transaction-date,
          .transaction-account,
          .transaction-amount {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </main>
  )
}
