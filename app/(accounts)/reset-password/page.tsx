'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthButton from '@/components/authButton'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Password reset failed')
      }

      setSuccess('Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[500px] w-full max-w-[1100px] items-center justify-center rounded-[58px] bg-white px-8 py-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] lg:min-h-[684px]">
      <div className="w-full max-w-[670px]">
        <h1 className="mb-12 text-center text-[2.6rem] font-bold text-black text-balance">
          RESET PASSWORD
        </h1>

        {error && <div className="mb-4 text-center text-red-500 font-bold">{error}</div>}
        {success && <div className="mb-4 text-center text-green-600 font-bold">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid items-center gap-4 md:grid-cols-[160px_1fr]">
            <label className="text-xl text-black" htmlFor="reset-email">
              Email:
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="grid items-center gap-4 md:grid-cols-[160px_1fr]">
            <label className="text-xl text-black" htmlFor="reset-otp">
              OTP:
            </label>
            <input
              id="reset-otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="grid items-center gap-4 md:grid-cols-[160px_1fr]">
            <label className="text-xl text-black" htmlFor="reset-password">
              New Password:
            </label>
            <input
              id="reset-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="mt-12 flex justify-center flex-col items-center gap-4">
            <AuthButton disabled={loading}>
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </AuthButton>
            
            <Link href="/login" className="text-lg font-bold text-black underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}
