'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DownloadsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted)]">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-serif text-[var(--fg)] mb-8">Downloads</h1>
        <div className="text-center py-24 border border-[var(--divider)]">
          <p className="text-[var(--muted)]">No downloads yet</p>
        </div>
      </div>
    </div>
  )
}
