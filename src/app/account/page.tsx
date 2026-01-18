'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconArrowLeft } from '@tabler/icons-react'
import { motion, useAnimationControls } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

export default function AccountPage() {
  const router = useRouter()
  const { user, loading, isPro, logout } = useAuth()
  const borderControls = useAnimationControls()
  const blurControls = useAnimationControls()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/home')
    }
  }, [user, loading, router])

  useEffect(() => {
    let isMounted = true
    const sequence = async () => {
      if (loading || !user) return
      if (!isMounted) return
      await borderControls.start({
        pathLength: 1,
        transition: { duration: 0.8, delay: 0.8, ease: [0.4, 0, 1, 1] },
      })
      if (!isMounted) return
      await blurControls.start({
        opacity: 1,
        backdropFilter: 'blur(3px)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        transition: { duration: 0.4, ease: 'easeOut' },
      })
    }
    sequence()

    return () => {
      isMounted = false
      borderControls.stop()
      blurControls.stop()
    }
  }, [borderControls, blurControls, loading, user])

  const handleLogout = async () => {
    await logout()
    router.push('/home')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: '#2a2618' }}>
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
          initial={{ filter: 'blur(8px) saturate(1)' }}
          animate={{ filter: 'blur(0px) saturate(0.85)' }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at center, transparent 0%, transparent 30%, rgba(0, 0, 0, 0.8) 100%)',
          }}
        />
        <div className="h-screen w-full flex items-center justify-center relative">
          <p className="text-white/70 text-sm font-light">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: '#2a2618' }}>
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
        initial={{ filter: 'blur(8px) saturate(1)' }}
        animate={{ filter: 'blur(0px) saturate(0.85)' }}
        transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at center, transparent 0%, transparent 30%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />
      <div className="h-screen w-full flex items-center justify-center relative">
        <div
          className="w-96 h-96 relative z-10"
          style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(255, 255, 255, 0)' }}
            initial={{ opacity: 0 }}
            animate={blurControls}
          />
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            width="384"
            height="384"
            style={{ overflow: 'visible', filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.4))' }}
          >
            <motion.path
              d="M 0 0 L 384 0 L 384 384 L 0 384 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.4"
              initial={{ pathLength: 0 }}
              animate={borderControls}
            />
          </svg>
          <div className="relative z-20 flex flex-col justify-between h-full">
            <div style={{ marginTop: '2rem' }}>
              <h1 className="text-6xl font-normal font-serif tracking-wide" style={{ color: '#b91c1c' }}>
                Fauna
              </h1>
              <div className="mt-3 text-white/80 text-sm font-light">{user.email}</div>
              <div className="mt-1 text-white/60 text-sm font-light">{isPro ? 'Pro' : 'Free'} plan</div>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/app"
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                style={{ borderRadius: 0 }}
              >
                <IconArrowLeft size={16} strokeWidth={1} className="text-white" />
                Back
              </Link>
              <Link
                href="/app/downloads"
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all text-center"
                style={{ borderRadius: 0 }}
              >
                Downloads
              </Link>
              {!isPro && (
                <Link
                  href="/pricing"
                  className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all text-center"
                  style={{ borderRadius: 0 }}
                >
                  Upgrade to Pro
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all"
                style={{ borderRadius: 0 }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

