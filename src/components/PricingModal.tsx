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
  const { user, upgradeToPro, login } = useAuth()

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
    if (!user) {
      router.push('/login')
      onClose()
    } else {
      upgradeToPro()
      onClose()
    }
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
        <h2 className="text-2xl font-serif text-[var(--fg)] mb-4">Get Pro</h2>
        <p className="text-[var(--muted)] mb-6">
          Unlock all assets, commercial licenses, and premium features.
        </p>
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-[var(--accent)]">✓</span>
            <span className="text-[var(--fg)]">Access to all Pro assets</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[var(--accent)]">✓</span>
            <span className="text-[var(--fg)]">Commercial license included</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[var(--accent)]">✓</span>
            <span className="text-[var(--fg)]">High-res and SVG exports</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[var(--accent)]">✓</span>
            <span className="text-[var(--fg)]">Batch downloads</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleUpgrade}
            className="flex-1 px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
          >
            {user ? 'Upgrade to Pro' : 'Log in to Upgrade'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-[var(--divider)] text-[var(--fg)] hover:bg-[var(--divider)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
