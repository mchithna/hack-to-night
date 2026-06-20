'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Sidebar from '../../components/sidebar'
import {
  Search,
  Settings,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft
} from '../../components/Icons'
import { Toaster, toast } from 'react-hot-toast'

type Biller = {
  id: string
  name: string
  logo: string
}

const billers: Biller[] = [
  { id: 'water', name: 'Water Board', logo: '/billers/water-board.png' },
  { id: 'cable', name: 'Cable TV', logo: '/billers/cable-tv.png' },
  { id: 'ceb', name: 'CEB', logo: '/billers/ceb.png' },
  { id: 'airtel', name: 'Airtel', logo: '/billers/airtel.png' },
  { id: 'dialog', name: 'Dialog', logo: '/billers/dialog.png' },
  { id: 'slt', name: 'Sri Lanka Telecom', logo: '/billers/electricity.png' },
  { id: 'peotv', name: 'PEO TV', logo: '/billers/mpesa.png' },
  { id: 'hutch', name: 'Hutch', logo: '/billers/hutch.png' },
  { id: 'aia', name: 'AIA', logo: '/billers/aia.png' },
  { id: 'lolc', name: 'LOLC', logo: '/billers/lolc.png' },
  { id: 'insurance2', name: 'Insurance', logo: '/billers/insurance2.png' },
  { id: 'hsbc', name: 'HSBC', logo: '/billers/hsbc.png' }
]

type Screen = 'select' | 'form' | 'success' | 'failed'

type FormErrors = {
  fromAccount?: string
  accountNumber?: string
  billId?: string
  dueAmount?: string
}

export default function PayBillsPage() {
  const [accounts, setAccounts] = useState<{account_number: string, account_name: string, balance: number}[]>([])
  const [fromAccount, setFromAccount] = useState('')
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const [screen, setScreen] = useState<Screen>('select')
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [billId, setBillId] = useState('')
  const [dueAmount, setDueAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [failReason, setFailReason] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/accounts')
        if (res.ok) {
          const data = await res.json()
          setAccounts(data.accounts || [])
          if (data.accounts && data.accounts.length > 0) {
            setFromAccount(data.accounts[0].account_number)
          }
        }
      } catch (err) {
        console.error('Failed to load accounts', err)
      } finally {
        setLoadingAccounts(false)
      }
    }
    fetchAccounts()
  }, [])

  function handleSelectBiller(biller: Biller) {
    setSelectedBiller(biller)
    setErrors({})
    setScreen('form')
  }

  function validateForm(): boolean {
    const newErrors: FormErrors = {}

    if (!fromAccount) {
      newErrors.fromAccount = 'Source account is required'
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required'
    } else if (!/^[0-9]{6,16}$/.test(accountNumber.trim())) {
      newErrors.accountNumber = 'Enter a valid account number (6–16 digits)'
    }

    if (!billId.trim()) {
      newErrors.billId = 'Bill ID is required'
    } else if (billId.trim().length < 3) {
      newErrors.billId = 'Bill ID looks too short'
    }

    if (!dueAmount.trim()) {
      newErrors.dueAmount = 'Due amount is required'
    } else {
      const amount = Number(dueAmount)
      if (Number.isNaN(amount) || amount <= 0) {
        newErrors.dueAmount = 'Enter a valid amount greater than 0'
      } else {
        const selectedAcc = accounts.find(a => a.account_number === fromAccount)
        if (selectedAcc && amount > Number(selectedAcc.balance)) {
          newErrors.dueAmount = 'Insufficient balance in selected account'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handlePayNow() {
    if (!validateForm()) {
      return
    }

    const loadToast = toast.loading("Processing payment...")

    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccount,
          billerId: selectedBiller?.id,
          amount: dueAmount,
          remarks
        })
      })

      const data = await res.json()
      toast.dismiss(loadToast)

      if (res.ok) {
        setConfirmationNumber(data.transaction?.id || Math.floor(10000000 + Math.random() * 90000000).toString())
        setScreen('success')
        toast.success("Payment successful!")
      } else {
        setFailReason(data.error || data.message || "Failed to process payment")
        setScreen('failed')
        toast.error("Payment failed")
      }
    } catch (err) {
      toast.dismiss(loadToast)
      setFailReason("Network error occurred. Please try again.")
      setScreen('failed')
      toast.error("Network error")
    }
  }

  function resetToHome() {
    setScreen('select')
    setSelectedBiller(null)
    setAccountNumber('')
    setBillId('')
    setDueAmount('')
    setRemarks('')
    setErrors({})
    // Refetch accounts to update balance
    setLoadingAccounts(true)
    fetch('/api/accounts').then(res => res.json()).then(data => {
      setAccounts(data.accounts || [])
      setLoadingAccounts(false)
    }).catch(() => setLoadingAccounts(false))
  }

  return (
    <div className="min-h-screen bg-bg-light font-geist p-0 overflow-x-hidden">
      <Toaster position="top-right" />
      <div className="flex min-h-screen">
        <div className="z-50 relative"><Sidebar /></div>

        <main className="flex-1 p-6 md:p-12 text-black relative">
          
          {/* Header */}
          <div className="mb-8 flex items-center justify-between animate-fade-in-down">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-[#9a5c97]">
              Pay Bills
            </h2>
            <div className="flex items-center gap-6 text-gray-500">
              <Search size={22} className="cursor-pointer hover:text-purple-700 transition-colors" />
              <Settings size={22} className="cursor-pointer hover:text-purple-700 transition-colors" />
              <div className="w-11 h-11 rounded-full bg-white border-2 border-white/50 shadow-md overflow-hidden hover-lift cursor-pointer">
                <Image src="/person-logo.png" alt="Profile" width={44} height={44} className="object-cover" />
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="w-full relative rounded-3xl overflow-hidden mb-12 shadow-[0_10px_40px_rgba(154,92,151,0.2)] animate-fade-in-up stagger-1 h-[220px]">
            <Image 
              src="/bills-banner.png" 
              alt="Bills Banner" 
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-transparent flex items-center p-10">
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">Settle Your Bills</h1>
                <p className="text-white/80">Pay utility bills, mobile top-ups, and more instantly.</p>
              </div>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto animate-fade-in-up stagger-2">
            {screen === 'select' && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-10">
                <h3 className="text-xl font-bold text-gray-800 mb-8 border-b border-gray-100 pb-4">Select Biller</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {billers.map((biller) => (
                    <button
                      key={biller.id}
                      onClick={() => handleSelectBiller(biller)}
                      className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center gap-4 hover-lift hover:border-purple-300 transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center p-3 group-hover:scale-110 transition-transform shadow-inner">
                        <img
                          src={biller.logo}
                          alt={biller.name}
                          className="w-full h-full object-contain drop-shadow-sm"
                          onError={(e) => { e.currentTarget.src = '/person-logo.png' }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 text-center">{biller.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {screen === 'form' && selectedBiller && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-10 max-w-2xl mx-auto relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-100/30 animate-float" />
                
                <button
                  className="flex items-center gap-2 text-gray-500 hover:text-purple-700 font-medium transition-colors mb-8"
                  onClick={() => setScreen('select')}
                >
                  <ChevronLeft size={18} />
                  Back to billers
                </button>

                <div className="flex items-center gap-4 mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center p-2 shadow-sm border border-gray-100">
                    <img
                      src={selectedBiller.logo}
                      alt={selectedBiller.name}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.src = '/person-logo.png' }}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedBiller.name}</h3>
                </div>

                <div className="space-y-6 relative z-10">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pay from Account</label>
                    <select
                      value={fromAccount}
                      onChange={(e) => setFromAccount(e.target.value)}
                      className={`w-full bg-white border ${errors.fromAccount ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4 shadow-sm`}
                      disabled={loadingAccounts}
                    >
                      {loadingAccounts ? <option>Loading...</option> : accounts.map(a => (
                        <option key={a.account_number} value={a.account_number}>
                          {a.account_number} - Rs. {Number(a.balance).toLocaleString()} ({a.account_name})
                        </option>
                      ))}
                    </select>
                    {errors.fromAccount && <span className="text-red-500 text-xs mt-1 block">{errors.fromAccount}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number / Phone Number</label>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className={`w-full bg-white border ${errors.accountNumber ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4 shadow-sm`}
                    />
                    {errors.accountNumber && <span className="text-red-500 text-xs mt-1 block">{errors.accountNumber}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bill ID / Reference</label>
                    <input
                      value={billId}
                      onChange={(e) => setBillId(e.target.value)}
                      placeholder="Enter bill ID"
                      className={`w-full bg-white border ${errors.billId ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4 shadow-sm`}
                    />
                    {errors.billId && <span className="text-red-500 text-xs mt-1 block">{errors.billId}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Due Amount (Rs)</label>
                    <input
                      type="number"
                      value={dueAmount}
                      onChange={(e) => setDueAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full bg-white border ${errors.dueAmount ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4 shadow-sm font-bold text-lg text-purple-900`}
                    />
                    {errors.dueAmount && <span className="text-red-500 text-xs mt-1 block">{errors.dueAmount}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks (Optional)</label>
                    <input
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="E.g. October Bill"
                      className="w-full bg-white border border-gray-200 focus:border-purple-400 focus:ring-purple-200 rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4 shadow-sm"
                    />
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={handlePayNow} 
                      className="w-full py-4 bg-gradient-to-r from-purple-800 to-[#9a5c97] hover:from-purple-900 hover:to-purple-800 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(154,92,151,0.39)] hover:shadow-[0_6px_20px_rgba(154,92,151,0.23)] hover:-translate-y-0.5"
                    >
                      PAY NOW
                    </button>
                  </div>
                </div>
              </div>
            )}

            {screen === 'success' && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-12 text-center animate-fade-in-up max-w-lg mx-auto">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
                  <CheckCircle2 size={48} />
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
                <p className="text-gray-500 mb-8 font-medium">Your bill has been settled.</p>
                
                <div className="bg-gray-50/50 rounded-2xl p-6 mb-10 border border-gray-100 max-w-sm mx-auto">
                  <p className="text-sm text-gray-400 mb-1">Confirmation Number</p>
                  <p className="font-mono font-bold text-lg text-gray-800 tracking-wider">{confirmationNumber}</p>
                </div>

                <button
                  onClick={resetToHome}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-colors inline-flex items-center gap-2"
                >
                  <ChevronLeft size={18} /> BACK TO HOME
                </button>
              </div>
            )}

            {screen === 'failed' && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-12 text-center animate-fade-in-up max-w-lg mx-auto">
                <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
                  <AlertTriangle size={48} />
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-2">Payment Failed</h3>
                <p className="text-red-500 font-medium mb-10">{failReason}</p>

                <button
                  onClick={() => setScreen('form')}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-colors inline-flex items-center gap-2"
                >
                  <ChevronLeft size={18} /> TRY AGAIN
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
