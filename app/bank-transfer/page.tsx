'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Sidebar from '@/components/sidebar'
import { Search, Bell } from '@/components/Icons'
import { Toaster, toast } from 'react-hot-toast'

type Errors = Partial<{
  fromAccount: string
  amount: string
  accountNumber: string
  accountName: string
  bank: string
}>

export default function Home() {
  const [accounts, setAccounts] = useState<{account_number: string, account_name: string, balance: number}[]>([])
  const [fromAccount, setFromAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [bank, setBank] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [step, setStep] = useState<'form' | 'confirm' | 'success' | 'failure'>('form')
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string>('')
  const [loadingAccounts, setLoadingAccounts] = useState(true)

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

  function validate() {
    const e: Errors = {}
    if (!fromAccount) e.fromAccount = 'Source account is required'
    
    if (!amount) e.amount = 'Amount is required'
    else if (Number(amount) <= 0 || isNaN(Number(amount)))
      e.amount = 'Enter a valid positive amount'
    else {
      const selectedAcc = accounts.find(a => a.account_number === fromAccount)
      if (selectedAcc && Number(amount) > Number(selectedAcc.balance)) {
        e.amount = 'Insufficient balance in selected account'
      }
    }

    if (!accountNumber) e.accountNumber = 'Account number is required'
    else if (!/^\d{6,}$/.test(accountNumber))
      e.accountNumber = 'Enter a valid account number'

    if (!accountName) e.accountName = 'Account name is required'

    if (!bank) e.bank = 'Select a bank'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      setStep('confirm')
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    const loadToast = toast.loading("Processing transfer...")
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccount,
          toAccount: accountNumber,
          amount,
          description
        })
      })

      const data = await res.json()
      toast.dismiss(loadToast)

      if (res.ok) {
        setConfirmation(data.transaction?.id || Math.floor(10000000 + Math.random() * 89999999).toString())
        setStep('success')
        toast.success("Transfer successful!")
      } else {
        setServerError(data.error || data.message || "Failed to process transfer")
        setStep('failure')
        toast.error("Transfer failed")
      }
    } catch (err) {
      toast.dismiss(loadToast)
      setServerError("Network error occurred. Please try again.")
      setStep('failure')
      toast.error("Network error")
    }
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
              Bank Transfer
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
          <div className="w-full relative rounded-3xl overflow-hidden mb-12 shadow-[0_10px_40px_rgba(154,92,151,0.2)] animate-fade-in-up stagger-1 h-[220px]">
            <Image 
              src="/transfer-banner.png" 
              alt="Transfer Banner" 
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-transparent flex items-center p-10">
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">Send Money Securely</h1>
                <p className="text-white/80">Fast and seamless transfers to any bank account.</p>
              </div>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto animate-fade-in-up stagger-2">
            {step === 'form' ? (
              <form onSubmit={handleNext} className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-10 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-100/30 animate-float" />
                
                <h3 className="text-2xl font-bold text-gray-800 mb-8 border-b border-gray-100 pb-4">Transfer Details</h3>
                
                <div className="grid grid-cols-12 gap-y-8 gap-x-6 items-start relative z-10">
                  
                  <label className="col-span-12 md:col-span-4 text-gray-700 font-semibold pt-3">From Account :</label>
                  <div className="col-span-12 md:col-span-8">
                    <select
                      value={fromAccount}
                      onChange={(e) => setFromAccount(e.target.value)}
                      className={`w-full bg-gray-50/50 border ${errors.fromAccount ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4`}
                      disabled={loadingAccounts}
                    >
                      {loadingAccounts ? <option>Loading...</option> : accounts.map(a => (
                        <option key={a.account_number} value={a.account_number}>
                          {a.account_number} - Rs. {Number(a.balance).toLocaleString()} ({a.account_name})
                        </option>
                      ))}
                    </select>
                    {errors.fromAccount && <div className="text-sm text-red-500 mt-1">{errors.fromAccount}</div>}
                  </div>

                  <label className="col-span-12 md:col-span-4 text-gray-700 font-semibold pt-3">Amount (Rs) :</label>
                  <div className="col-span-12 md:col-span-8">
                    <input
                      aria-label="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full bg-gray-50/50 border ${errors.amount ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4 text-xl font-bold text-purple-900`}
                      placeholder="0.00"
                    />
                    {errors.amount && <div className="text-sm text-red-500 mt-1">{errors.amount}</div>}
                  </div>

                  <label className="col-span-12 md:col-span-4 text-gray-700 font-semibold pt-3">Recipient Account :</label>
                  <div className="col-span-12 md:col-span-8">
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className={`w-full bg-gray-50/50 border ${errors.accountNumber ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4`}
                      placeholder="Enter account number"
                    />
                    {errors.accountNumber && <div className="text-sm text-red-500 mt-1">{errors.accountNumber}</div>}
                  </div>

                  <label className="col-span-12 md:col-span-4 text-gray-700 font-semibold pt-3">Recipient Name :</label>
                  <div className="col-span-12 md:col-span-8">
                    <input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className={`w-full bg-gray-50/50 border ${errors.accountName ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4`}
                      placeholder="Enter account name"
                    />
                    {errors.accountName && <div className="text-sm text-red-500 mt-1">{errors.accountName}</div>}
                  </div>

                  <label className="col-span-12 md:col-span-4 text-gray-700 font-semibold pt-3">Recipient Bank :</label>
                  <div className="col-span-12 md:col-span-8">
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className={`w-full bg-gray-50/50 border ${errors.bank ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4`}
                    >
                      <option value="">Choose bank</option>
                      <option>First National</option>
                      <option>Global Trust</option>
                      <option>Union Bank</option>
                    </select>
                    {errors.bank && <div className="text-sm text-red-500 mt-1">{errors.bank}</div>}
                  </div>

                  <label className="col-span-12 md:col-span-4 text-gray-700 font-semibold pt-3">Description :</label>
                  <div className="col-span-12 md:col-span-8">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-50/50 border border-gray-200 focus:border-purple-400 focus:ring-purple-200 rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4 resize-none"
                      placeholder="Optional remarks"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-10">
                  <button type="submit" className="px-10 py-3 bg-gradient-to-r from-purple-800 to-[#9a5c97] hover:from-purple-900 hover:to-purple-800 text-white font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(154,92,151,0.39)] hover:shadow-[0_6px_20px_rgba(154,92,151,0.23)] hover:-translate-y-0.5 w-full md:w-auto">
                    CONTINUE TO CONFIRMATION
                  </button>
                </div>
              </form>
            ) : step === 'confirm' ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-purple-800"></div>
                <h3 className="text-3xl font-bold text-gray-800 mb-8 mt-4">Confirm Transfer</h3>
                
                <div className="bg-gray-50/50 rounded-2xl p-8 mb-8 border border-gray-100 shadow-inner">
                  <p className="text-gray-500 font-medium mb-2">You are about to transfer</p>
                  <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-[#9a5c97] mb-6">
                    Rs. {Number(amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </div>
                  
                  <div className="flex items-center justify-center gap-6 text-gray-700">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">From</p>
                      <p className="font-semibold">{fromAccount}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 animate-pulse">
                      ➔
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-gray-400">To</p>
                      <p className="font-semibold">{accountName}</p>
                      <p className="text-xs text-gray-500">{bank} - {accountNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-10">
                  <button
                    onClick={() => setStep('form')}
                    className="px-10 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-colors w-full md:w-auto"
                  >
                    BACK
                  </button>
                  <button
                    onClick={handleTransfer}
                    className="px-10 py-3 bg-gradient-to-r from-purple-800 to-[#9a5c97] hover:from-purple-900 hover:to-purple-800 text-white font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(154,92,151,0.39)] hover:shadow-[0_6px_20px_rgba(154,92,151,0.23)] hover:-translate-y-0.5 w-full md:w-auto"
                  >
                    CONFIRM & TRANSFER
                  </button>
                </div>
              </div>
            ) : step === 'success' ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-12 text-center animate-fade-in-up">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-12 h-12">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-2">Transfer Successful!</h3>
                <p className="text-gray-500 mb-8 font-medium">Your money is on its way.</p>
                
                <div className="bg-gray-50/50 rounded-2xl p-6 mb-10 border border-gray-100 max-w-sm mx-auto">
                  <p className="text-sm text-gray-400 mb-1">Confirmation Number</p>
                  <p className="font-mono font-bold text-lg text-gray-800 tracking-wider">{confirmationNumber}</p>
                </div>

                <button
                  onClick={() => {
                    setAmount('')
                    setAccountNumber('')
                    setAccountName('')
                    setBank('')
                    setDescription('')
                    setErrors({})
                    setConfirmation(null)
                    setStep('form')
                  }}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-colors"
                >
                  MAKE ANOTHER TRANSFER
                </button>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-12 text-center animate-fade-in-up">
                <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-12 h-12">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-2">Transaction Failed</h3>
                <p className="text-red-500 font-medium mb-10">{serverError}</p>

                <button
                  onClick={() => setStep('form')}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-colors"
                >
                  TRY AGAIN
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
