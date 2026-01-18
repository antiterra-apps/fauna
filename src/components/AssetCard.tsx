'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Asset } from '@/lib/types'

interface AssetCardProps {
  asset: Asset
}

export function AssetCard({ asset }: AssetCardProps) {
  return (
    <Link href={`/asset/${asset.id}`}>
      <div className="relative w-full aspect-[4/3] bg-[var(--divider)] group hover:opacity-90 transition-opacity">
        <Image
          src={asset.imageUrl}
          alt={asset.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {!asset.isFree && (
          <div className="absolute top-2 right-2 bg-[var(--accent)] text-[var(--bg)] text-xs px-2 py-1 font-medium">
            Pro
          </div>
        )}
        <div className="absolute inset-0 bg-[var(--fg)] opacity-0 group-hover:opacity-5 transition-opacity" />
      </div>
    </Link>
  )
}
