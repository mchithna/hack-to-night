'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  const protectedRoutes = [
    '/dashboard',
    '/bank-transfer',
    '/pay-bills',
    '/e-statement',
    '/bank-accounts',
    '/smart-spend'
  ]

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      const isProtected = protectedRoutes.some((route) => pathname?.startsWith(route))
      if (!isProtected) {
        if (mounted) setAuthorized(true)
        return
      }

      // Fast path: localStorage may already have user
      const cached = typeof window !== 'undefined' && localStorage.getItem('user')
      if (cached) {
        if (mounted) setAuthorized(true)
        return
      }

      // Verify server-side session via API (sends httpOnly cookie)
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const json = await res.json()
          if (json?.user) {
            localStorage.setItem('user', JSON.stringify(json.user))
            if (mounted) setAuthorized(true)
            return
          }
        }
      } catch (e) {
        console.error('SessionGuard: session check failed', e)
      }

      if (mounted) {
        setAuthorized(false)
        router.push('/login')
      }
    }

    checkSession()
    return () => {
      mounted = false
    }
  }, [pathname, router])

  if (!authorized && protectedRoutes.some((route) => pathname?.startsWith(route))) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f1f1f1]">
        <div className="text-xl font-bold text-black">Checking Session...</div>
      </div>
    )
  }

  return <>{children}</>
}
