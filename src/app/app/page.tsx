'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { mockCollections } from '@/lib/mockData'
import { CollectionSquaresRow } from '@/components/CollectionSquaresRow'

export default function AppPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/home')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="pt-16 min-h-screen" />
  }

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#2a2618' }}>
      <div className="pt-16">
        {mockCollections.map((collection, idx) => (
          <CollectionSquaresRow
            key={collection.id}
            collection={collection}
            titleOverride={idx === 0 ? "Engineer's Manual" : undefined}
            isSmallTitle={idx === 0}
          />
        ))}
      </div>
    </div>
  )
}
