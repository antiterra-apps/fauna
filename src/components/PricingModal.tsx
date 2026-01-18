'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const router = useRouter()
  const { user, upgradeToPro, isPro } = useAuth()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleUpgrade = () => {
    if (isPro) {
      router.push('/app')
      onClose()
      return
    }
    if (!user) {
      router.push('/login')
      onClose()
      return
    }
    upgradeToPro()
    router.push('/app')
    onClose()
  }

  const handleCustom = () => {
    router.push('/pricing')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg)] border border-[var(--divider)] max-w-lg w-full mx-4 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-serif text-[var(--fg)] mb-2">Choose a plan</h2>
        <p className="text-[var(--muted)] mb-6">Free, Pro, or a custom license.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="border border-[var(--divider)] p-4">
            <div className="text-[var(--fg)] font-medium mb-1">Free</div>
            <div className="text-[var(--muted)] text-sm mb-4">Explore and download free assets.</div>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)]">✓</span>
                <span className="text-[var(--fg)]">Free collection access</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)]">✓</span>
                <span className="text-[var(--fg)]">Basic downloads</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-[var(--divider)] text-[var(--fg)] hover:bg-[var(--divider)] transition-colors"
            >
              Continue
            </button>
          </div>

          <div className="border border-[var(--divider)] p-4">
            <div className="text-[var(--fg)] font-medium mb-1">Pro</div>
            <div className="text-[var(--muted)] text-sm mb-4">Everything, plus licensing and exports.</div>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)]">✓</span>
                <span className="text-[var(--fg)]">All Pro assets</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)]">✓</span>
                <span className="text-[var(--fg)]">Commercial license</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)]">✓</span>
                <span className="text-[var(--fg)]">High-res + SVG exports</span>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              className="w-full px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
            >
              {isPro ? 'Go to App' : user ? 'Upgrade' : 'Log in'}
            </button>
          </div>

          <div className="border border-[var(--divider)] p-4">
            <div className="text-[var(--fg)] font-medium mb-1">Custom</div>
            <div className="text-[var(--muted)] text-sm mb-4">Teams, enterprise, and special licensing.</div>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)]">✓</span>
                <span className="text-[var(--fg)]">Custom terms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)]">✓</span>
                <span className="text-[var(--fg)]">Invoice / purchase order</span>
              </div>
            </div>
            <button
              onClick={handleCustom}
              className="w-full px-4 py-2 border border-[var(--divider)] text-[var(--fg)] hover:bg-[var(--divider)] transition-colors"
            >
              Contact
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 border border-[var(--divider)] text-[var(--fg)] hover:bg-[var(--divider)] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
