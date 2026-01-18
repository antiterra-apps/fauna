'use client'

import { useEffect, useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { User } from '@/lib/types'

export function useAuth() {
  const { data: session, status } = useSession()
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const email = session?.user?.email
    if (!email || typeof window === 'undefined') {
      setIsPro(false)
      return
    }
    const stored = localStorage.getItem(`fauna_pro:${email}`)
    setIsPro(stored === '1')
  }, [session?.user?.email])

  const user: User | null = session?.user?.email
    ? { id: session.user.email, email: session.user.email, isPro }
    : null

  const login = async (email: string, password: string) => {
    return await signIn('credentials', { email, password, redirect: false })
  }

  const logout = async () => {
    await signOut({ callbackUrl: '/home' })
  }

  const upgradeToPro = () => {
    if (!user || typeof window === 'undefined') return
    localStorage.setItem(`fauna_pro:${user.email}`, '1')
    setIsPro(true)
  }

  return {
    user,
    isPro,
    loading: status === 'loading',
    login,
    logout,
    upgradeToPro,
  }
}
