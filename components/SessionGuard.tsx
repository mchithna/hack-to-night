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
    const checkSession = () => {
      const isProtected = protectedRoutes.some((route) => pathname?.startsWith(route))
      if (!isProtected) {
        setAuthorized(true)
        return
      }

      // Check localStorage for basic user presence
      const user = localStorage.getItem('user')
      if (!user) {
        setAuthorized(false)
        router.push('/login')
      } else {
        setAuthorized(true)
      }
    }

    checkSession()
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
