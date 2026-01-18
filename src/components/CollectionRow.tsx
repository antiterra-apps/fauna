'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Collection } from '@/lib/types'
import { applyPalette, resetPalette } from '@/lib/palette'

interface CollectionRowProps {
  collection: Collection
}

export function CollectionRow({ collection }: CollectionRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  const previewAssets = collection.assets.filter(a => a.isFree)
  const totalCount = collection.assets.length

  const handleMouseEnter = () => {
    setIsHovered(true)
    applyPalette(collection.defaultPalette)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    resetPalette()
  }

  return (
    <div
      className="border-b border-[var(--divider)]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-b border-[var(--divider)] -mx-6 px-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif text-[var(--fg)] leading-tight py-3">{collection.title}</h2>
            <span className="text-[var(--muted)] text-sm py-3">{totalCount} illustrations</span>
            <p className="text-[var(--muted)] text-sm leading-tight py-3">{collection.description}</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto -mx-4 px-4">
          {previewAssets.map((asset, idx) => (
            <motion.div
              key={asset.id}
              initial={false}
              animate={{
                y: isHovered ? -2 : 0,
                opacity: isHovered ? 0.95 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <Link href={`/asset/${asset.id}`}>
                <div className="relative w-48 h-32 bg-[var(--divider)] group">
                  <Image
                    src={asset.imageUrl}
                    alt={asset.title}
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                  {!asset.isFree && (
                    <div className="absolute top-2 right-2 bg-[var(--accent)] text-[var(--bg)] text-xs px-2 py-1 font-medium">
                      Pro
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[var(--fg)] opacity-0 group-hover:opacity-5 transition-opacity" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
