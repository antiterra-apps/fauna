'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      router.push(user ? '/app' : '/home')
    }
  }, [user, loading, router])

  return <div className="pt-16 min-h-screen" />
}
