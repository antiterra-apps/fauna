'use client'

import { motion, useAnimationControls } from 'framer-motion'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alegreya } from 'next/font/google'
import { useAuth } from '@/hooks/useAuth'

const alegreya = Alegreya({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
})

export default function HeroPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const borderControls = useAnimationControls()

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
    }
    sequence()
  }, [borderControls])

  if (!loading && user) return null

  return (
    <>
      {/* Hero Section - full screen height */}
      <div className="h-screen w-full flex items-center justify-center relative">
        <div className="w-96 h-96 relative z-10" style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
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
              className={`text-6xl font-normal font-alegreya tracking-wide ${alegreya.className}`}
              style={{ color: '#f3e8d2' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.3, ease: 'easeOut' }}
            >
              Fauna
            </motion.h1>
          </div>
          <motion.span
            className="text-[#f3e8d2] text-xl font-light"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.9, ease: 'easeOut' }}
          >
            A visual system
            <br />
            for modern software
          </motion.span>
          </div>
        </div>
      </div>
      <section
        className="w-full"
        style={{
          backgroundColor: '#f3e8d2',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.10), rgba(255,255,255,0.10)), url(/paper-grain.svg)',
          backgroundRepeat: 'repeat, repeat',
          backgroundSize: 'auto, 512px 512px',
          backgroundBlendMode: 'normal, soft-light',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className={`text-4xl font-normal font-alegreya tracking-wide ${alegreya.className}`}
                style={{ color: '#2a2618' }}
              >
                What is Fauna?
              </h2>
              <p
                className="text-base leading-relaxed mt-6"
                style={{ color: 'rgba(42, 38, 24, 0.78)' }}
              >
                Fauna is a curated illustration system for software products.
                <br />
                <br />
                The goal is simple: make illustrations predictable to use, easy to integrate, and consistent as a product evolves.
              </p>
            </div>
            <div>
              <div
                role="img"
                aria-label="Placeholder image"
                className="w-full h-80 md:h-96 bg-black/10 border border-black/10"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
