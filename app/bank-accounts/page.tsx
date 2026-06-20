'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Sidebar from '@/components/sidebar'
import { Search, Bell } from '@/components/Icons'
import { Toaster, toast } from 'react-hot-toast'

type Screen = 'list' | 'add' | 'edit'

type Account = {
  account_number: string
  account_name: string
  balance: number
  username: string
  full_name: string
}

export default function AccountsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center">Loading accounts...</div>}>
      <AccountsContent />
    </React.Suspense>
  )
}

function AccountsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [screen, setScreen] = useState<Screen>('list')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const isEditMode = searchParams.get('mode') === 'edit'
  const accountNumberParam = searchParams.get('accountNumber') || ''
  const accountNameParam = searchParams.get('accountName') || ''

  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
  })

  const [nickname, setNickname] = useState('')

  const [errors, setErrors] = useState({
    accountNumber: '',
    accountName: '',
    nickname: ''
  })

  async function fetchAccounts() {
    try {
      setLoading(true)
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch (err) {
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        accountNumber: accountNumberParam,
        accountName: accountNameParam,
      })
      setNickname(accountNameParam)
      setScreen('edit')
    }
  }, [isEditMode, accountNumberParam, accountNameParam])

  const validateField = (name: string, value: string) => {
    let error = ''
    switch (name) {
      case 'accountNumber':
        if (!value.trim()) error = 'Account number is required'
        else if (!/^\d+$/.test(value)) error = 'Account number must contain only numbers'
        else if (value.length < 8 || value.length > 20) error = 'Account number must be between 8 and 20 digits'
        break
      case 'accountName':
      case 'nickname':
        if (!value.trim()) error = 'Name is required'
        else if (value.trim().length < 2) error = 'Name must be at least 2 characters'
        break
    }
    return error
  }

  const validateForm = () => {
    const newErrors = {
      accountNumber: validateField('accountNumber', formData.accountNumber),
      accountName: validateField('accountName', formData.accountName),
      nickname: ''
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some(err => err !== '')
  }

  const resetForm = () => {
    setFormData({ accountNumber: '', accountName: '' })
    setNickname('')
    setErrors({ accountNumber: '', accountName: '', nickname: '' })
  }

  const goToList = () => {
    resetForm()
    setScreen('list')
    router.push('/bank-accounts')
    fetchAccounts()
  }

  const goToAdd = () => {
    resetForm()
    setScreen('add')
    router.push('/bank-accounts?mode=add')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const loadToast = toast.loading("Adding account...")
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      toast.dismiss(loadToast)
      if (res.ok) {
        toast.success('Account added successfully!')
        goToList()
      } else {
        toast.error('Failed to add account')
      }
    } catch (err) {
      toast.dismiss(loadToast)
      toast.error('Network error')
    }
  }

  const handleEditNickname = async (e: React.FormEvent) => {
    e.preventDefault()
    const error = validateField('nickname', nickname)
    if (error) {
      toast.error(error)
      return
    }

    const loadToast = toast.loading("Updating account...")
    try {
      const res = await fetch('/api/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: formData.accountNumber, accountName: nickname })
      })
      toast.dismiss(loadToast)
      if (res.ok) {
        toast.success(`Account name updated to: ${nickname}`)
        goToList()
      } else {
        toast.error('Failed to update account')
      }
    } catch (err) {
      toast.dismiss(loadToast)
      toast.error('Network error')
    }
  }

  const handleDeleteAccount = async (accountNumber: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return
    const loadToast = toast.loading("Deleting account...")
    try {
      const res = await fetch(`/api/accounts?accountNumber=${accountNumber}`, {
        method: 'DELETE'
      })
      toast.dismiss(loadToast)
      if (res.ok) {
        toast.success('Account deleted successfully!')
        fetchAccounts()
      } else {
        toast.error('Failed to delete account')
      }
    } catch (err) {
      toast.dismiss(loadToast)
      toast.error('Network error')
    }
  }

  return (
    <div className="min-h-screen bg-bg-light font-geist p-0 overflow-x-hidden">
      <Toaster position="top-right" />
      <div className="flex min-h-screen">
        <div className="z-50 relative"><Sidebar /></div>
        <main className="flex-1 p-6 md:p-12 text-black relative">
          
          {screen === 'list' && (
            <div className="animate-fade-in-up">
              <div className="mb-8 flex items-center justify-between animate-fade-in-down">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-[#9a5c97]">
                  Bank Accounts
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
                  src="/accounts-banner.png" 
                  alt="Accounts Banner" 
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-transparent flex items-center p-10">
                  <div className="text-white">
                    <h1 className="text-4xl font-bold mb-2">Your Vault</h1>
                    <p className="text-white/80">Manage your connected bank accounts and cards securely.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-2">
                {loading ? (
                  <div className="text-gray-500 font-medium">Loading accounts...</div>
                ) : accounts.length > 0 ? (
                  accounts.map((acc, index) => (
                    <div key={acc.account_number} className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-6 hover-lift relative group transition-all" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                      <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/bank-accounts?mode=edit&accountNumber=${acc.account_number}&accountName=${encodeURIComponent(acc.account_name)}`)}
                          className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center hover:bg-purple-200 transition-colors shadow-sm"
                          title="Edit Nickname"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteAccount(acc.account_number)}
                          className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
                          title="Delete Account"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="flex flex-col items-center text-center mt-2">
                        <div className="w-24 h-24 rounded-full bg-white shadow-md border-4 border-white mb-4 overflow-hidden relative">
                          <Image src="/account-logo.png" alt="bank" fill className="object-cover" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">{acc.account_name}</h2>
                        <p className="text-gray-500 text-sm mb-4">Nova Bank • {acc.account_number}</p>
                        <div className="w-full bg-purple-50 rounded-2xl py-3 px-4 mt-2">
                          <span className="text-xs font-semibold text-purple-600 uppercase tracking-widest block mb-1">Balance</span>
                          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-[#9a5c97]">
                            Rs. {acc.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 w-full col-span-full font-medium">No accounts found. Add one below!</p>
                )}

                <button onClick={goToAdd} className="bg-white/40 backdrop-blur-sm border-2 border-dashed border-purple-300 shadow-sm rounded-3xl p-6 hover-lift flex flex-col items-center justify-center min-h-[280px] text-purple-600 hover:bg-white/60 hover:border-purple-400 transition-all group">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-sm">+</div>
                  <h2 className="text-lg font-bold">Add a Bank Account</h2>
                  <p className="text-sm text-purple-500/80 mt-2">Link another external account</p>
                </button>
              </div>
            </div>
          )}

          {screen === 'add' && (
            <div className="animate-fade-in-up">
              <div className="mb-8 flex items-center justify-between animate-fade-in-down">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-[#9a5c97]">
                  Add Account
                </h2>
              </div>
              
              <div className="max-w-2xl mx-auto mt-12 bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-8 hover-lift animate-fade-in-up stagger-1">
                <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Link Another Bank Account</h2>
                <form onSubmit={handleAddAccount} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Account Number</label>
                    <input 
                      name="accountNumber" 
                      value={formData.accountNumber} 
                      onChange={handleChange} 
                      placeholder="Enter 8-20 digit account number" 
                      className={`w-full bg-gray-50/50 border ${errors.accountNumber ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4`} 
                    />
                    {errors.accountNumber && <span className="text-red-500 text-xs mt-1 block">{errors.accountNumber}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Name (Nickname)</label>
                    <input 
                      name="accountName" 
                      value={formData.accountName} 
                      onChange={handleChange} 
                      placeholder="e.g. My Savings" 
                      className={`w-full bg-gray-50/50 border ${errors.accountName ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'} rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4`} 
                    />
                    {errors.accountName && <span className="text-red-500 text-xs mt-1 block">{errors.accountName}</span>}
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={goToList} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-800 to-[#9a5c97] hover:from-purple-900 hover:to-purple-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                      Add Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {screen === 'edit' && (
            <div className="animate-fade-in-up">
              <div className="mb-8 flex items-center justify-between animate-fade-in-down">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-[#9a5c97]">
                  Edit Account
                </h2>
              </div>
              
              <div className="max-w-2xl mx-auto mt-12 bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(154,92,151,0.15)] rounded-3xl p-8 hover-lift animate-fade-in-up stagger-1">
                <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Edit Account Nickname</h2>
                <form onSubmit={handleEditNickname} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Account Number</label>
                    <input 
                      type="text" 
                      value={formData.accountNumber} 
                      disabled 
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Name</label>
                    <input 
                      type="text" 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value)} 
                      placeholder="Enter new nickname" 
                      required 
                      className="w-full bg-gray-50/50 border border-gray-200 focus:border-purple-400 focus:ring-purple-200 rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:ring-4" 
                    />
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={goToList} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-800 to-[#9a5c97] hover:from-purple-900 hover:to-purple-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                      Update Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
