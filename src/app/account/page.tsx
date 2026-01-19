'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconArrowLeft } from '@tabler/icons-react'
import { useAuth } from '@/hooks/useAuth'

export default function AccountPage() {
  const router = useRouter()
  const { user, loading, isPro, logout } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/home')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await logout()
    router.push('/home')
  }

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2a2618' }}>
        <p className="text-white/70 text-sm font-light">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="pt-16 min-h-screen" style={{ backgroundColor: '#2a2618' }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <button
          onClick={() => router.push('/app')}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          aria-label="Back to app"
        >
          <IconArrowLeft size={18} strokeWidth={1.5} />
          <span className="text-sm font-light">Back</span>
        </button>

        <div className="mt-8 text-white">
          <div className="text-sm font-light text-white/80">You are logged in as {user.email}</div>

          <div className="mt-6 flex flex-col gap-3 max-w-sm">
            {!isPro && (
              <Link
                href="/pricing"
                className="px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all text-center"
                style={{ borderRadius: 0 }}
              >
                Upgrade to Pro
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all"
              style={{ borderRadius: 0 }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

