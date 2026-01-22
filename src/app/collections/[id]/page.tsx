'use client'

import { useParams, useRouter } from 'next/navigation'
import { IconArrowLeft } from '@tabler/icons-react'
import { getCollectionById, getAssetsForCollection } from '@/lib/catalog'
import { AssetCard } from '@/components/AssetCard'

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string
  const collection = getCollectionById(collectionId)
  const assets = collection ? getAssetsForCollection(collectionId) : []

  if (!collection) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2a2618' }}>
        <div className="text-center">
          <h1 className="text-2xl font-serif text-white mb-2">Collection not found</h1>
          <button
            onClick={() => router.push('/app')}
            className="text-white/80 hover:text-white underline-offset-4 hover:underline"
          >
            Return to app
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#2a2618' }}>
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back()
              } else {
                router.push('/app')
              }
            }}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
            aria-label="Back"
          >
            <IconArrowLeft size={18} strokeWidth={1.5} />
            <span className="text-sm font-light">Back</span>
          </button>

          <div className="mb-8 mt-6">
            <h1 className="text-4xl font-serif text-white">{collection.title}</h1>
            {collection.description && (
              <p className="text-white/70 mt-2 text-lg">{collection.description}</p>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>

          {assets.length === 0 && (
            <div className="text-center py-24">
              <p className="text-white/60">No assets found in this collection</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
