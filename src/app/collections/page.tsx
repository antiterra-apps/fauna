'use client'

import { CollectionRow } from '@/components/CollectionRow'
import { mockCollections } from '@/lib/mockData'

export default function CollectionsPage() {
  return (
    <div className="pt-16">
      <div className="border-b border-[var(--divider)]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-serif text-[var(--fg)]">Collections</h1>
        </div>
      </div>
      <div>
        {mockCollections.map((collection) => (
          <CollectionRow key={collection.id} collection={collection} />
        ))}
      </div>
    </div>
  )
}
