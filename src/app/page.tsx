'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import HomePageContent from './HomePageContent'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/home')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="pt-16 min-h-screen" />
  }

  if (!user) {
    return null
  }

  return <HomePageContent />
}
