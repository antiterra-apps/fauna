'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { collections } from '@/lib/catalog'
import { CollectionSquaresRow } from '@/components/CollectionSquaresRow'
import { Skeleton } from '@/components/Skeleton'

export default function AppPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/home')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#2a2618' }}>
        <div className="pt-16">
          {Array.from({ length: 3 }).map((_, rowIdx) => (
            <div key={rowIdx} className="w-full overflow-x-auto">
              <div className="flex gap-4 w-max px-6 py-6">
                {Array.from({ length: 5 }).map((__, tileIdx) => (
                  <Skeleton
                    key={tileIdx}
                    className="w-48 h-48 bg-white/10 border border-white/10"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#2a2618' }}>
      <div className="pt-16">
        {collections.map((collection, idx) => (
          <CollectionSquaresRow
            key={collection.id}
            collection={collection}
            titleOverride={undefined}
            isSmallTitle={idx === 0}
          />
        ))}
      </div>
    </div>
  )
}
