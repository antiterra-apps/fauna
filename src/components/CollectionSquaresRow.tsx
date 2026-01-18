'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Collection } from '@/lib/types'
import { useMemo } from 'react'

const TILE_SIZE_PX = 192
const FEATURED_COUNT = 4

interface CollectionSquaresRowProps {
  collection: Collection
  titleOverride?: string
  isSmallTitle?: boolean
}

export function CollectionSquaresRow({ collection, titleOverride, isSmallTitle }: CollectionSquaresRowProps) {
  const featured = useMemo(() => collection.assets.slice(0, FEATURED_COUNT), [collection.assets])
  const title = titleOverride ?? collection.title

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-4 w-max px-6 py-6">
        <div
          className="relative flex-shrink-0"
          style={{ width: TILE_SIZE_PX, height: TILE_SIZE_PX }}
        >
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(3px)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}
          />
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            width={TILE_SIZE_PX}
            height={TILE_SIZE_PX}
            style={{ overflow: 'visible', filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.4))' }}
          >
            <path
              d={`M 0 0 L ${TILE_SIZE_PX} 0 L ${TILE_SIZE_PX} ${TILE_SIZE_PX} L 0 ${TILE_SIZE_PX} Z`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.4"
            />
          </svg>
          <div className="relative z-20 h-full w-full flex items-end justify-start px-4 pb-4 text-left">
            <div className={isSmallTitle ? 'text-sm' : 'text-base'} style={{ color: '#ffffff' }}>
              <span className="font-normal font-sans leading-tight">{title}</span>
            </div>
          </div>
        </div>

        {featured.map((asset) => (
          <Link key={asset.id} href={`/asset/${asset.id}`} className="flex-shrink-0">
            <div
              className="relative overflow-hidden"
              style={{ width: TILE_SIZE_PX, height: TILE_SIZE_PX }}
            >
              <Image
                src={asset.imageUrl}
                alt={asset.title}
                fill
                className="object-cover"
                sizes={`${TILE_SIZE_PX}px`}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

