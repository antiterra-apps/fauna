'use client'

import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alegreya } from 'next/font/google'
import { useAuth } from '@/hooks/useAuth'
import { mockCollections } from '@/lib/mockData'

const alegreya = Alegreya({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
})

export default function HeroPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const borderControls = useAnimationControls()
  const [carouselPaused, setCarouselPaused] = useState(false)
  const [activeCollectionId, setActiveCollectionId] = useState(mockCollections[0]?.id || '')
  
  const activeCollection = mockCollections.find(c => c.id === activeCollectionId)

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
          <div className="max-w-xl mx-auto text-left">
            <h2
              className={`text-4xl font-normal font-alegreya tracking-wide ${alegreya.className}`}
              style={{ color: '#2a2618' }}
            >
              What is Fauna?
            </h2>
            <p
              className="text-lg leading-relaxed mt-6 font-light"
              style={{ color: '#2a2618' }}
            >
              Fauna is a curated illustration system for software products.
              <br />
              <br />
              The goal is simple: make illustrations predictable to use, easy to integrate, and consistent as a product evolves.
            </p>
          </div>
        </div>
      </section>
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
          <h2
            className={`text-5xl font-normal font-alegreya tracking-wide text-center mb-16 leading-snug ${alegreya.className}`}
            style={{ color: '#2a2618' }}
          >
            A better way to build tasteful apps
            <br />
            for developers, agents and founders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="aspect-square bg-black/10 border border-black/10" />
              <h3
                className="text-2xl font-bold mt-4"
                style={{ color: '#2a2618', fontFamily: 'Helvetica, Arial, sans-serif' }}
              >
                Curated collections
              </h3>
              <p
                className="text-lg leading-relaxed mt-2 font-light"
                style={{ color: '#2a2618' }}
              >
                Find high quality illustrations faster thanks to our curated collections.
              </p>
            </div>
            <div>
              <div className="aspect-square bg-black/10 border border-black/10" />
              <h3
                className="text-2xl font-bold mt-4"
                style={{ color: '#2a2618', fontFamily: 'Helvetica, Arial, sans-serif' }}
              >
                Expressive imageries
              </h3>
              <p
                className="text-lg leading-relaxed mt-2 font-light"
                style={{ color: '#2a2618' }}
              >
                Illuminate ideas with concrete yet open-ended imagery.
              </p>
            </div>
            <div>
              <div className="aspect-square bg-black/10 border border-black/10" />
              <h3
                className="text-2xl font-bold mt-4"
                style={{ color: '#2a2618', fontFamily: 'Helvetica, Arial, sans-serif' }}
              >
                Systematic visuals
              </h3>
              <p
                className="text-lg leading-relaxed mt-2 font-light"
                style={{ color: '#2a2618' }}
              >
                Maintain consistency across platforms by ensuring all assets follow the same visual rules.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        className="w-full overflow-hidden"
        style={{
          backgroundColor: '#f3e8d2',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.10), rgba(255,255,255,0.10)), url(/paper-grain.svg)',
          backgroundRepeat: 'repeat, repeat',
          backgroundSize: 'auto, 512px 512px',
          backgroundBlendMode: 'normal, soft-light',
        }}
      >
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-6 mb-8">
            <div className="flex gap-6">
              {mockCollections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => setActiveCollectionId(collection.id)}
                  className={`text-lg font-light transition-all pb-1 border-b ${
                    activeCollectionId === collection.id
                      ? 'text-[#2a2618] border-[#2a2618]'
                      : 'text-[#2a2618]/40 border-transparent hover:text-[#2a2618]/70'
                  }`}
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                >
                  {collection.title}
                </button>
              ))}
            </div>
          </div>
          <div
            className="min-h-64"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
          >
            <div
              className="flex gap-8"
              style={{
                animation: 'scroll-left 40s linear infinite',
                animationPlayState: carouselPaused ? 'paused' : 'running',
                width: 'max-content',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
            >
              {activeCollection?.assets?.map((asset) => (
                <div
                  key={asset.id}
                  className="w-64 h-64 flex-shrink-0 bg-black/10"
                  style={{
                    backgroundImage: `url(${asset.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backfaceVisibility: 'hidden',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes scroll-left {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </section>
      <footer
        className="w-full"
        style={{
          backgroundColor: '#2a2618',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-8 flex flex-col justify-end min-h-[300px]">
          <div className="flex justify-between items-end">
            <h3
              className={`text-3xl font-normal font-alegreya tracking-wide ${alegreya.className}`}
              style={{ color: '#f3e8d2' }}
            >
              Fauna
            </h3>
            <p
              className="text-sm"
              style={{ color: '#f3e8d2' }}
            >
              © 2026 Fauna. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
