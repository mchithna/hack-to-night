'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthButton from '@/components/authButton'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Store basic info in localStorage if needed for UI
      localStorage.setItem('user', JSON.stringify(data.user))
      
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[480px] w-full max-w-[1060px] overflow-hidden rounded-[56px] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] lg:min-h-[660px]">
      <aside
        aria-label="Nova Bank shell artwork"
        className="relative hidden w-[46.2%] shrink-0 overflow-hidden bg-[#1d0730] md:block"
      >
        <img
          src="/loginshellbg.png"
          alt=""
          className="size-full object-cover"
          aria-hidden="true"
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/loginlogo.png"
            alt="Nova Bank"
            className="w-[38%] max-w-[276px]"
          />
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center bg-white px-8 py-10">
        <form onSubmit={handleSubmit} className="w-full max-w-[450px] text-center">
          <h1 className="mb-8 text-[2.45rem] font-bold text-black text-balance">
            LOGIN
          </h1>

          {error && <div className="mb-4 text-red-500 font-bold">{error}</div>}

          <div className="space-y-5">
            <div className="relative">
              <label className="sr-only" htmlFor="login-account">
                Username
              </label>
              <img
                src="/person.png"
                alt=""
                aria-hidden="true"
                className="-translate-y-1/2 absolute left-8 top-1/2 size-6"
              />
              <input
                id="login-account"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="h-[64px] w-full rounded-[40px] border-0 bg-[#d9d9d9] px-8 pl-20 text-lg text-black shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] outline-none transition-shadow placeholder:text-black/45 focus:shadow-[0_4px_4px_0_rgba(0,0,0,0.30),0_8px_12px_6px_rgba(0,0,0,0.15)]"
              />
            </div>

            <div className="relative">
              <label className="sr-only" htmlFor="login-password">
                Password
              </label>
              <img
                src="/password.png"
                alt=""
                aria-hidden="true"
                className="-translate-y-1/2 absolute left-8 top-1/2 size-6"
              />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-[64px] w-full rounded-[40px] border-0 bg-[#d9d9d9] px-8 pl-20 text-lg text-black shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] outline-none transition-shadow placeholder:text-black/45 focus:shadow-[0_4px_4px_0_rgba(0,0,0,0.30),0_8px_12px_6px_rgba(0,0,0,0.15)]"
              />
            </div>
          </div>

          <div className="mt-3 text-right">
            <Link
              href="/reset-password"
              className="text-sm font-bold text-black"
            >
              Forgot password?
            </Link>
          </div>

          <AuthButton className="mt-8" disabled={loading}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </AuthButton>

          <p className="mt-6 text-sm font-bold text-black">
            Don`t have an account?
          </p>
          <Link href="/sign-up" className="text-2xl font-bold text-black">
            SIGN UP
          </Link>
        </form>
      </div>
    </section>
  )
}
