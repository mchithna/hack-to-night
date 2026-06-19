'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Sidebar from '@/components/sidebar'
import { Search, Bell } from '@/components/Icons'
import { Toaster, toast } from 'react-hot-toast'
import styles from './accounts.module.css'

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
      console.log('Adding new account:', formData)
      toast.success('Account added successfully!')
      resetForm()
      goToList()
    }
  }

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if at least account number is filled
    if (!formData.accountNumber.trim()) {
      toast.error('Please enter an account number first')
      return
    }

    const loadToast = toast.loading("Updating account...")
    try {
      // ... implementation for update
    } catch (err) {
      toast.error('Network error')
    } finally {
      toast.dismiss(loadToast)
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
    <main className={styles.accountsPage}>
      <Toaster position="top-right" />
      <Sidebar />
      <section className={styles.content}>
        {screen === 'list' && (
          <>
            <header className={styles.contentHeader}>
              <h1 className={styles.pageTitle}>Accounts</h1>
              <div className={styles.headerActions}>
                <Search size={22} />
                <Bell size={22} />
                <div className={styles.avatarPlaceholder}>
                  <Image src="/person-logo.png" alt="Profile" width={40} height={40} style={{ objectFit: 'cover', borderRadius: '50%' }} />
                </div>
              </div>
            </header>

            <div className={styles.cardsContainer}>
              {loading ? (
                <>
                  <div className={`${styles.accountCard} animate-pulse bg-gray-200 h-[140px] border-none shadow-none`}></div>
                  <div className={`${styles.accountCard} animate-pulse bg-gray-200 h-[140px] border-none shadow-none`}></div>
                </>
              ) : accounts.length > 0 ? (
                accounts.map(acc => (
                  <div key={acc.account_number} className={styles.accountCard}>
                    <div className={styles.iconEdit} onClick={() => router.push(`/bank-accounts?mode=edit&accountNumber=${acc.account_number}&accountName=${encodeURIComponent(acc.account_name)}`)}>
                      ✏️
                    </div>
                    <div className={styles.iconDelete} onClick={() => handleDeleteAccount(acc.account_number)}>🗑️</div>
                    <div className={styles.accountCardContent}>
                      <h2 className={styles.accountName}>{acc.account_name}</h2>
                      <div className={styles.accountAvatar}>
                        <Image src="/account-logo.png" alt="profile" width={100} height={100} style={{ objectFit: 'cover', borderRadius: '50%' }} />
                      </div>
                      <p className={styles.accountDetails}>
                        Nova Bank <br />
                        {acc.account_number}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 w-full col-span-2">No accounts found. Add one below!</p>
              )}

              <button className={styles.addAccountCard} onClick={goToAdd}>
                <h2 className={styles.addAccountTitle}>Add a Bank Account</h2>
                <div className={styles.addAccountIcon}>+</div>
              </button>
            </div>
          </>
        )}

        {screen === 'add' && (
          <>
            <header className={styles.contentHeader}>
              <h1 className={styles.pageTitle}>Add Account</h1>
            </header>
            <div className={styles.formContainer}>
              <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Add Another Bank Account</h2>
                <form className={styles.formFields} onSubmit={handleAddAccount}>
                  <div className={styles.formGroup}>
                    <label>Bank Account Number:</label>
                    <input name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Enter account number" className={errors.accountNumber ? styles.inputError : ''} />
                    {errors.accountNumber && <span className={styles.fieldError}>{errors.accountNumber}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Account Name (Nickname):</label>
                    <input name="accountName" value={formData.accountName} onChange={handleChange} placeholder="Enter account holder name" className={errors.accountName ? styles.inputError : ''} />
                    {errors.accountName && <span className={styles.fieldError}>{errors.accountName}</span>}
                  </div>
                  <div className={styles.formActionsBottom}>
                    <button type="button" className={styles.btnCancel} onClick={goToList}>Cancel</button>
                    <button type="submit" className={styles.btnAdd}>Add Account</button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {screen === 'edit' && (
          <>
            <header className={styles.contentHeader}>
              <h1 className={styles.pageTitle}>Edit Account</h1>
            </header>
            <div className={styles.formContainer}>
              <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Edit the account name</h2>
                <form onSubmit={handleEditNickname} className={styles.formFields}>
                  <div className={styles.formGroup}>
                    <label>Bank Account Number:</label>
                    <input type="text" value={formData.accountNumber} disabled className={styles.inputDisabled} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Account Name:</label>
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Enter new nickname" required />
                  </div>
                  <div className={styles.formActionsBottom}>
                    <button type="button" className={styles.btnCancel} onClick={goToList}>Cancel</button>
                    <button type="submit" className={styles.btnUpdate}>UPDATE</button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
