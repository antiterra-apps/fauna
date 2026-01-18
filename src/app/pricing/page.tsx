'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function PricingPage() {
  const router = useRouter()
  const { user, upgradeToPro, isPro } = useAuth()

  const handleUpgrade = () => {
    if (!user) {
      router.push('/login')
      return
    }
    upgradeToPro()
    router.push('/app')
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-5xl font-serif text-[var(--fg)] mb-6 text-center">
          Get Pro
        </h1>
        <p className="text-xl text-[var(--muted)] mb-12 text-center max-w-2xl mx-auto">
          Unlock all assets, commercial licenses, and premium features.
        </p>

        <div className="border border-[var(--divider)] p-12 mb-12">
          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-[var(--accent)] text-xl">✓</span>
              <div>
                <h3 className="text-lg font-medium text-[var(--fg)] mb-1">
                  Access to all Pro assets
                </h3>
                <p className="text-[var(--muted)]">
                  Download thousands of premium fauna illustrations and icons.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-[var(--accent)] text-xl">✓</span>
              <div>
                <h3 className="text-lg font-medium text-[var(--fg)] mb-1">
                  Commercial license included
                </h3>
                <p className="text-[var(--muted)]">
                  Use assets in commercial projects without restrictions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-[var(--accent)] text-xl">✓</span>
              <div>
                <h3 className="text-lg font-medium text-[var(--fg)] mb-1">
                  High-res and SVG exports
                </h3>
                <p className="text-[var(--muted)]">
                  Get assets in multiple formats and resolutions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-[var(--accent)] text-xl">✓</span>
              <div>
                <h3 className="text-lg font-medium text-[var(--fg)] mb-1">
                  Batch downloads
                </h3>
                <p className="text-[var(--muted)]">
                  Download entire collections at once.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-[var(--accent)] text-xl">✓</span>
              <div>
                <h3 className="text-lg font-medium text-[var(--fg)] mb-1">
                  Save to boards
                </h3>
                <p className="text-[var(--muted)]">
                  Organize your favorite assets in custom boards.
                </p>
              </div>
            </div>
          </div>

          {isPro ? (
            <div className="text-center py-6 border-t border-[var(--divider)]">
              <p className="text-[var(--muted)] mb-4">You already have Pro access</p>
              <button
                onClick={() => router.push('/app')}
                className="px-6 py-3 border border-[var(--divider)] text-[var(--fg)] hover:bg-[var(--divider)] transition-colors"
              >
                Go to Account
              </button>
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              className="w-full px-6 py-4 bg-[var(--accent)] text-[var(--bg)] font-medium text-lg hover:opacity-90 transition-opacity"
            >
              {user ? 'Upgrade to Pro' : 'Log in to Upgrade'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
