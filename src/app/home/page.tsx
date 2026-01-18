'use client'

import { motion, useAnimationControls } from 'framer-motion'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HeroPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const borderControls = useAnimationControls()
  const blurControls = useAnimationControls()

  useEffect(() => {
    if (!loading && user) {
      router.push('/app')
    }
  }, [user, loading, router])

  useEffect(() => {
    const sequence = async () => {
      await borderControls.start({
        pathLength: 1,
        transition: { duration: 0.8, delay: 1.5, ease: [0.4, 0, 1, 1] }
      })
      await blurControls.start({
        opacity: 1,
        backdropFilter: 'blur(3px)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        transition: { duration: 0.4, ease: 'easeOut' }
      })
    }
    sequence()
  }, [borderControls, blurControls])

  if (!loading && user) return null

  return (
    <>
      {/* Hero Section - full screen height */}
      <div className="h-screen w-full flex items-center justify-center relative">
        <div className="w-96 h-96 relative z-10" style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
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
            <motion.h1
              className="text-6xl font-normal font-serif tracking-wide"
              style={{ color: '#b91c1c' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.3, ease: 'easeOut' }}
            >
              Fauna
            </motion.h1>
          </div>
          <motion.span
            className="text-white text-xl font-light"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.9, ease: 'easeOut' }}
          >
            a generative illustration library
          </motion.span>
          </div>
        </div>
      </div>
    </>
  )
}
