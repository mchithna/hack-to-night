'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthButton from '@/components/authButton'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      setSuccess('Registration successful! Redirecting to login...')
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
    <section className="mx-auto min-h-[700px] w-full max-w-[1100px] rounded-[58px] bg-white px-8 py-9 shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] lg:min-h-[820px] lg:px-14">
      <div className="relative mx-auto w-full max-w-[860px]">
        <img
          src="/loginlogo.png"
          alt="Nova Bank"
          className="absolute left-0 top-0 hidden w-[128px] md:block"
        />

        <h1 className="mb-8 text-center text-[2.6rem] font-bold text-black text-balance">
          SIGN UP
        </h1>

        {error && <div className="mb-4 text-center text-red-500 font-bold">{error}</div>}
        {success && <div className="mb-4 text-center text-green-600 font-bold">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid items-center gap-4 md:grid-cols-[180px_1fr]">
            <label className="text-xl text-black" htmlFor="username">Username :</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="grid items-center gap-4 md:grid-cols-[180px_1fr]">
            <label className="text-xl text-black" htmlFor="email">Email :</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="grid items-center gap-4 md:grid-cols-[180px_1fr]">
            <label className="text-xl text-black" htmlFor="fullName">Full Name :</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="grid items-center gap-4 md:grid-cols-[180px_1fr]">
            <label className="text-xl text-black" htmlFor="password">Password :</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="grid items-center gap-4 md:grid-cols-[180px_1fr]">
            <label className="text-xl text-black" htmlFor="confirmPassword">Confirm Password :</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
            />
          </div>

          <div className="mt-8 flex justify-center">
            <AuthButton type="submit" disabled={loading}>
              {loading ? 'SIGNING UP...' : 'SIGN UP'}
            </AuthButton>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm font-bold text-black">Already have an account?</p>
            <Link href="/login" className="text-lg font-bold text-black underline">
              SIGN IN
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}
