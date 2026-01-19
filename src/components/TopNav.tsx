'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { IconSearch, IconUser } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { PricingModal } from './PricingModal'

function TopNavContent() {
  const { user, logout } = useAuth()
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPricingOpen, setIsPricingOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo and Search - far left */}
          <div className="flex items-center gap-4">
            <Link href={user ? '/app' : '/home'} className="flex items-center">
              <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center" style={{ borderRadius: 0 }}>
                <span className="text-white text-xs font-light">F</span>
              </div>
            </Link>
            {!isSearchExpanded ? (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="text-white text-sm font-light hover:opacity-80 transition-opacity flex items-center gap-1.5"
              >
                <IconSearch size={16} strokeWidth={1} className="text-white" />
                <span>Search</span>
              </button>
            ) : (
              <motion.input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                autoFocus
                onBlur={() => {
                  if (!searchQuery.trim()) {
                    setIsSearchExpanded(false)
                  }
                }}
                className="w-32 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 text-sm font-light"
                style={{ borderRadius: 0, transformOrigin: 'left' }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </div>

          {/* Spacer for middle */}
          <div className="flex-1" />

          {/* Buttons - far right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPricingOpen(true)}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all"
              style={{ borderRadius: 0 }}
            >
              Get pro
            </button>
            {user ? (
              <Link
                href="/account"
                aria-label="Account"
                className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all flex items-center justify-center"
                style={{ borderRadius: 0 }}
              >
                <IconUser size={16} strokeWidth={1} className="text-white" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all"
                style={{ borderRadius: 0 }}
              >
                Sign up
              </Link>
            )}
          </div>
        </div>
      </nav>
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </>
  )
}

function TopNavFallback() {
  const [isPricingOpen, setIsPricingOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center" style={{ borderRadius: 0 }}>
              <span className="text-white text-xs font-light">F</span>
            </div>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPricingOpen(true)}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light"
              style={{ borderRadius: 0 }}
            >
              Get pro
            </button>
            <Link
              href="/login"
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light"
              style={{ borderRadius: 0 }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </>
  )
}

export function TopNav() {
  return (
    <Suspense fallback={
      <TopNavFallback />
    }>
      <TopNavContent />
    </Suspense>
  )
}
