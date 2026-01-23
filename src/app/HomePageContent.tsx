'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CollectionRow } from '@/components/CollectionRow'
import { AssetCard } from '@/components/AssetCard'
import { mockCollections, getAllAssets } from '@/lib/mockData'

type ViewMode = 'collection' | 'concept'

function HomePageContentInner() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const [viewMode, setViewMode] = useState<ViewMode>('collection')

  const filteredAssets = useMemo(() => {
    let assets = getAllAssets()

    if (searchQuery) {
      assets = assets.filter(
        a => a.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return assets
  }, [searchQuery])

  const filteredCollections = useMemo(() => {
    if (!searchQuery) return mockCollections

    return mockCollections.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assets?.some(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [searchQuery])

  return (
    <div className="pt-16">
      {!searchQuery && (
        <div className="border-b border-[var(--divider)]">
          <div className="max-w-7xl mx-auto px-6 pt-8 pb-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-4xl font-serif text-[var(--fg)]">Browse</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('collection')}
                className={`text-sm transition-colors ${
                  viewMode === 'collection'
                    ? 'text-[var(--fg)]'
                    : 'text-[var(--muted)] hover:text-[var(--fg)]'
                }`}
              >
                by collection
              </button>
              <span className="text-[var(--divider)]">/</span>
              <button
                onClick={() => setViewMode('concept')}
                className={`text-sm transition-colors ${
                  viewMode === 'concept'
                    ? 'text-[var(--fg)]'
                    : 'text-[var(--muted)] hover:text-[var(--fg)]'
                }`}
              >
                by concept type
              </button>
            </div>
          </div>
        </div>
      )}

      {searchQuery && (
        <div className="border-b border-[var(--divider)]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-serif text-[var(--fg)] mb-2">
              Search results for &quot;{searchQuery}&quot;
            </h1>
            <p className="text-[var(--muted)]">
              {filteredAssets.length} {filteredAssets.length === 1 ? 'result' : 'results'}
            </p>
          </div>
        </div>
      )}

      {viewMode === 'collection' && !searchQuery ? (
        <div>
          {filteredCollections.map((collection) => (
            <CollectionRow
              key={collection.id}
              collection={collection}
            />
          ))}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
          {filteredAssets.length === 0 && (
            <div className="text-center py-24">
              <p className="text-[var(--muted)]">No assets found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HomePageContent() {
  return (
    <Suspense fallback={<div className="pt-16 min-h-screen" />}>
      <HomePageContentInner />
    </Suspense>
  )
}
