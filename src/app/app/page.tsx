'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function AppPage() {
  const router = useRouter()
  const { user, loading, isPro } = useAuth()

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
        <h1 className="text-4xl font-serif text-[var(--fg)] mb-8">Account</h1>

        <div className="space-y-8 mb-12">
          <div className="border-b border-[var(--divider)] pb-6">
            <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-2">
              Email
            </h2>
            <p className="text-[var(--fg)]">{user.email}</p>
          </div>

          <div className="border-b border-[var(--divider)] pb-6">
            <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-2">
              Plan
            </h2>
            <p className="text-[var(--fg)] mb-4">
              {isPro ? 'Pro' : 'Free'}
            </p>
            {!isPro && (
              <Link
                href="/pricing"
                className="inline-block px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
              >
                Upgrade to Pro
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/app/downloads"
            className="block py-4 border-b border-[var(--divider)] text-[var(--fg)] hover:text-[var(--accent)] transition-colors"
          >
            Downloads
          </Link>
          <div className="py-4 border-b border-[var(--divider)] text-[var(--muted)]">
            Boards (coming soon)
          </div>
          <div className="py-4 border-b border-[var(--divider)] text-[var(--muted)]">
            Settings (coming soon)
          </div>
        </div>
      </div>
    </div>
  )
}
