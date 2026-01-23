'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { IconSearch, IconUser, IconMoon, IconSun } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { PricingModal } from './PricingModal'
import { useColorSelector } from '@/contexts/ColorSelectorContext'
import { brownLight, brownDark, navyLight, navyDark, rustLight, rustDark, lavenderLight, lavenderDark, emeraldLight, emeraldDark } from '@/lib/catalog'

const COLOR_PRESETS = [
  { id: 'brown_light', primary: brownLight.fg, secondary: brownLight.bg, primaryLight: brownDark.fg, secondaryLight: brownDark.bg },
  { id: 'navy_light', primary: navyLight.fg, secondary: navyLight.bg, primaryLight: navyDark.fg, secondaryLight: navyDark.bg },
  { id: 'rust_light', primary: rustLight.fg, secondary: rustLight.bg, primaryLight: rustDark.fg, secondaryLight: rustDark.bg },
  { id: 'lavender_light', primary: lavenderLight.fg, secondary: lavenderLight.bg, primaryLight: lavenderDark.fg, secondaryLight: lavenderDark.bg },
  { id: 'emerald_light', primary: emeraldLight.fg, secondary: emeraldLight.bg, primaryLight: emeraldDark.fg, secondaryLight: emeraldDark.bg },
] as const

function TopNavContent() {
  const { user, logout } = useAuth()
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [isPastHero, setIsPastHero] = useState(false)
  const colorSelector = useColorSelector()

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight
      setIsPastHero(window.scrollY > heroHeight - 100)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const textColor = isPastHero ? '#2a2618' : 'white'
  const bgClass = isPastHero ? 'bg-black/10' : 'bg-white/10'
  const borderClass = isPastHero ? 'border-black/20' : 'border-white/20'
  const hoverBgClass = isPastHero ? 'hover:bg-black/20' : 'hover:bg-white/20'

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
          {/* Logo and Search - far left */}
          <div className="flex items-center gap-4">
            <Link href={user ? '/app' : '/home'} className="flex items-center">
              <div
                className={`w-8 h-8 backdrop-blur-md border flex items-center justify-center transition-colors duration-300 ${bgClass} ${borderClass}`}
                style={{ borderRadius: 0 }}
              >
                <span className="text-xs font-light transition-colors duration-300" style={{ color: textColor }}>F</span>
              </div>
            </Link>
            {!isSearchExpanded ? (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="text-sm font-light hover:opacity-80 transition-all duration-300 flex items-center gap-1.5"
                style={{ color: textColor }}
              >
                <IconSearch size={16} strokeWidth={1} style={{ color: textColor }} />
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
                className={`w-32 px-4 py-2 backdrop-blur-md border focus:outline-none text-sm font-light transition-colors duration-300 ${bgClass} ${borderClass}`}
                style={{ borderRadius: 0, transformOrigin: 'left', color: textColor }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </div>

          {/* Center: Dark mode toggle and color selector when scrolled */}
          {colorSelector?.showInNav && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: Math.min(1, colorSelector.scrollProgress * 1.5), y: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
            >
              <button
                onClick={() => colorSelector?.setIsDarkMode(!colorSelector.isDarkMode)}
                aria-label="Toggle dark mode"
                className={`w-8 h-8 backdrop-blur-md border flex items-center justify-center transition-all duration-300 ${bgClass} ${borderClass} ${hoverBgClass}`}
                style={{ borderRadius: 0 }}
              >
                {colorSelector?.isDarkMode ? (
                  <IconSun size={16} strokeWidth={1.5} style={{ color: textColor }} />
                ) : (
                  <IconMoon size={16} strokeWidth={1.5} style={{ color: textColor }} />
                )}
              </button>
              <div className="flex gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => colorSelector.setSelectedPresetId(p.id as any)}
                    aria-label={`Color preset ${p.id}`}
                    className="w-7 h-7 border transition-colors"
                    style={{
                      borderRadius: 0,
                      backgroundColor: (p as any).primary,
                      borderColor: colorSelector.selectedPresetId === p.id 
                        ? (isPastHero ? 'rgba(42, 38, 24, 0.6)' : 'rgba(255, 255, 255, 0.6)')
                        : (isPastHero ? 'rgba(42, 38, 24, 0.15)' : 'rgba(255, 255, 255, 0.15)'),
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Buttons - far right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPricingOpen(true)}
              className={`px-4 py-2 backdrop-blur-md border text-sm font-light transition-all duration-300 ${bgClass} ${borderClass} ${hoverBgClass}`}
              style={{ borderRadius: 0, color: textColor }}
            >
              Get pro
            </button>
            {user ? (
              <Link
                href="/account"
                aria-label="Account"
                className={`w-10 h-10 backdrop-blur-md border text-sm font-light transition-all duration-300 flex items-center justify-center ${bgClass} ${borderClass} ${hoverBgClass}`}
                style={{ borderRadius: 0 }}
              >
                <IconUser size={16} strokeWidth={1} style={{ color: textColor }} />
              </Link>
            ) : (
              <Link
                href="/login"
                className={`px-4 py-2 backdrop-blur-md border text-sm font-light transition-all duration-300 ${bgClass} ${borderClass} ${hoverBgClass}`}
                style={{ borderRadius: 0, color: textColor }}
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
