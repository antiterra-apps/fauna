'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function HeroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [sequenceComplete, setSequenceComplete] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sequenceComplete) {
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight
        setMousePosition({ x, y })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [sequenceComplete])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSequenceComplete(true)
    }, 2800)
    return () => clearTimeout(timer)
  }, [])

  const offsetX = sequenceComplete ? (mousePosition.x - 0.5) * 3 : 0
  const offsetY = sequenceComplete ? (mousePosition.y - 0.5) * 3 : 0

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden" 
      style={{ 
        backgroundColor: '#2a2618',
      }}
    >
      <motion.div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/hero-bg.jpg)',
          backgroundPosition: `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`,
        }}
        initial={{ filter: 'blur(8px) saturate(1)' }}
        animate={{ filter: 'blur(0px) saturate(0.85)' }}
        transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
      />
      <div className="fixed inset-0" style={{ 
        background: 'radial-gradient(ellipse 60% 60% at center, transparent 0%, transparent 30%, rgba(0, 0, 0, 0.8) 100%)'
      }} />
      <div className="relative">
        {children}
      </div>
    </div>
  )
}
