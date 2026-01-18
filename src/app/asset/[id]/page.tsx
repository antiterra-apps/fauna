'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { getAssetById, getCollectionById } from '@/lib/mockData'
import { PricingModal } from '@/components/PricingModal'

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isPro } = useAuth()
  const [showPricingModal, setShowPricingModal] = useState(false)

  const assetId = params.id as string
  const asset = getAssetById(assetId)
  const collection = asset ? getCollectionById(asset.collectionId) : null

  if (!asset) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-[var(--fg)] mb-2">Asset not found</h1>
          <button
            onClick={() => router.push('/')}
            className="text-[var(--accent)] hover:underline"
          >
            Return to browse
          </button>
        </div>
      </div>
    )
  }

  const canDownload = asset.isFree || isPro

  const handleDownload = () => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!isPro && !asset.isFree) {
      setShowPricingModal(true)
      return
    }
    // TODO: Implement actual download
    alert('Download started (stub)')
  }

  const handleViewLicense = () => {
    if (!isPro && !asset.isFree) {
      setShowPricingModal(true)
      return
    }
    // TODO: Show license modal
    alert('License view (stub)')
  }

  return (
    <>
      <div className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div className="relative w-full aspect-square bg-[var(--divider)]">
              <Image
                src={asset.imageUrl}
                alt={asset.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <div>
              <h1 className="text-4xl font-serif text-[var(--fg)] mb-4">{asset.title}</h1>
              {collection && (
                <p className="text-[var(--muted)] mb-6">
                  From <span className="text-[var(--fg)]">{collection.title}</span>
                </p>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-2">
                    Availability
                  </h2>
                  <p className="text-[var(--fg)]">
                    {asset.isFree ? 'Free' : 'Pro'}
                  </p>
                </div>
                {asset.conceptType && (
                  <div>
                    <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-2">
                      Concept Type
                    </h2>
                    <p className="text-[var(--fg)]">{asset.conceptType}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-8">
                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
                >
                  {!user
                    ? 'Log in to download'
                    : !isPro && !asset.isFree
                    ? 'Get Pro to download'
                    : 'Download'}
                </button>
                <button
                  onClick={handleViewLicense}
                  className="w-full px-6 py-3 border border-[var(--divider)] text-[var(--fg)] hover:bg-[var(--divider)] transition-colors"
                >
                  View license
                </button>
              </div>

              {!isPro && !asset.isFree && (
                <div className="border-t border-[var(--divider)] pt-6">
                  <h3 className="text-sm font-medium text-[var(--fg)] mb-2">
                    Pro features
                  </h3>
                  <ul className="space-y-2 text-sm text-[var(--muted)]">
                    <li>• High-res export</li>
                    <li>• SVG export</li>
                    <li>• Variants</li>
                    <li>• Batch download</li>
                    <li>• Save to board</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
      />
    </>
  )
}
