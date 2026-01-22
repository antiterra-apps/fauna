'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Asset } from '@/lib/types'

interface AssetCardProps {
  asset: Asset
}

export function AssetCard({ asset }: AssetCardProps) {
  const imageUrl = asset.metadata?.normalizedPngUrl || asset.imageUrl
  const imageUrlWithCache = imageUrl ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}v=2` : imageUrl
  
  return (
    <Link href={`/asset/${asset.id}`}>
      <div
        className="relative w-full aspect-square p-8 group hover:opacity-90 transition-opacity"
        style={{
          backgroundColor: '#f7f3eb',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.10), rgba(255,255,255,0.10)), url(/paper-grain.svg)',
          backgroundRepeat: 'repeat, repeat',
          backgroundSize: 'auto, 512px 512px',
          backgroundBlendMode: 'normal, multiply',
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src={imageUrlWithCache || asset.imageUrl}
            alt={asset.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        {!asset.isFree && (
          <div className="absolute top-10 right-10 bg-[var(--accent)] text-[var(--bg)] text-xs px-2 py-1 font-medium">
            Pro
          </div>
        )}
        <div className="absolute inset-0 bg-[var(--fg)] opacity-0 group-hover:opacity-5 transition-opacity" />
      </div>
    </Link>
  )
}
