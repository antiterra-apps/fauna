'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Asset } from '@/lib/types'
import { useColorSelector } from '@/contexts/ColorSelectorContext'

interface AssetCardProps {
  asset: Asset
  primaryColor?: string
  secondaryColor?: string
}

function normalizeSvgMarkup(raw: string, isNormalized: boolean = false) {
  const withoutScripts = raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  const withScopedStyle = withoutScripts.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (m) =>
    m.replace(/\*\s*\{/g, '.fauna-svg-scope *{'),
  )
  return withScopedStyle.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
    const classedAttrs = /\bclass=/.test(attrs)
      ? attrs.replace(/\bclass=(".*?"|'.*?')/i, (cm: string) => cm.slice(0, -1) + ' fauna-svg-scope' + cm.slice(-1))
      : `${attrs} class="fauna-svg-scope"`
    // For normalized SVGs, preserve their existing preserveAspectRatio (usually "meet")
    // For original SVGs, use "slice" for better fill
    const preserveAspectRatio = isNormalized 
      ? (attrs.match(/\bpreserveAspectRatio=(".*?"|'.*?')/i)?.[1]?.slice(1, -1) || 'xMidYMid meet')
      : 'xMidYMid slice'
    return `<svg${classedAttrs} width="100%" height="100%" preserveAspectRatio="${preserveAspectRatio}">`
  })
}

function getSvgUrlChain(asset: Asset): { url: string; isNormalized: boolean }[] {
  const chain: { url: string; isNormalized: boolean }[] = []
  if (asset.metadata?.normalizedSvgUrl) chain.push({ url: asset.metadata.normalizedSvgUrl, isNormalized: true })
  if (asset.metadata?.svgPotraceUrl) chain.push({ url: asset.metadata.svgPotraceUrl, isNormalized: false })
  if (asset.metadata?.svgUrl) chain.push({ url: asset.metadata.svgUrl, isNormalized: false })
  return chain
}

export function AssetCard({ asset, primaryColor, secondaryColor }: AssetCardProps) {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null)
  const [svgFailed, setSvgFailed] = useState(false)
  const colorSelector = useColorSelector()

  useEffect(() => {
    const chain = getSvgUrlChain(asset)
    if (chain.length === 0) {
      setSvgFailed(true)
      return
    }

    let cancelled = false
    setSvgMarkup(null)
    setSvgFailed(false)

    const tryFetch = (index: number) => {
      if (cancelled || index >= chain.length) {
        if (!cancelled) setSvgFailed(true)
        return
      }
      const { url, isNormalized } = chain[index]
      const cacheVersion = isNormalized ? 'v=9' : 'v=8'
      const urlWithCache = `${url}${url.includes('?') ? '&' : '?'}${cacheVersion}`

      fetch(urlWithCache)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch svg (${r.status})`)
          return r.text()
        })
        .then((text) => {
          if (cancelled) return
          const normalized = normalizeSvgMarkup(text, isNormalized)
          setSvgMarkup(normalized)
        })
        .catch(() => {
          if (cancelled) return
          tryFetch(index + 1)
        })
    }

    tryFetch(0)
    return () => {
      cancelled = true
    }
  }, [asset])

  const defaultPrimary = primaryColor || '#2d2416'
  const defaultSecondary = secondaryColor || '#faf8f5'
  
  return (
    <Link href={`/asset/${asset.id}`} className="min-w-0 block w-full">
      <div
        className="relative w-full aspect-square p-1 overflow-hidden group hover:opacity-90 transition-opacity"
        style={{
          backgroundColor: secondaryColor || (colorSelector?.isDarkMode ? '#1a1a1a' : '#f7f3eb'),
          backgroundImage: colorSelector?.isDarkMode 
            ? undefined
            : 'linear-gradient(rgba(255,255,255,0.10), rgba(255,255,255,0.10)), url(/paper-grain.svg)',
          backgroundRepeat: colorSelector?.isDarkMode ? undefined : 'repeat, repeat',
          backgroundSize: colorSelector?.isDarkMode ? undefined : 'auto, 512px 512px',
          backgroundBlendMode: colorSelector?.isDarkMode ? undefined : 'normal, multiply',
        }}
      >
        <div className="relative w-full h-full min-h-0 min-w-0">
          {svgMarkup ? (
            <div
              className="w-full h-full min-h-0 min-w-0 overflow-hidden"
              style={{
                ['--svg-primary' as any]: defaultPrimary,
                ['--svg-secondary' as any]: defaultSecondary,
              }}
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          ) : svgFailed ? (
            <div className="absolute inset-0 bg-white/10" />
          ) : (
            <div className="absolute inset-0 bg-white/10 animate-pulse" />
          )}
        </div>
        {!asset.isFree && (
          <div className="absolute top-1 right-1 bg-[var(--accent)] text-[var(--bg)] text-xs px-2 py-1 font-medium">
            Pro
          </div>
        )}
        <div className="absolute inset-0 bg-[var(--fg)] opacity-0 group-hover:opacity-5 transition-opacity" />
      </div>
    </Link>
  )
}
