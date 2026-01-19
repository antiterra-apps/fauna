'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IconArrowLeft, IconChevronDown, IconDownload } from '@tabler/icons-react'
import { useAuth } from '@/hooks/useAuth'
import { getAssetById, getCollectionById } from '@/lib/catalog'
import { PricingModal } from '@/components/PricingModal'
import { Skeleton } from '@/components/Skeleton'

const COLOR_PRESETS = [
  { id: 'default' },
  { id: 'cream_charcoal', primary: '#f3efe7', secondary: '#1b1b1b' },
  { id: 'cobalt_ice', primary: '#2d5bff', secondary: '#d8e6ff' },
  { id: 'rust_sand', primary: '#c25a3c', secondary: '#f1d6b8' },
  { id: 'lavender_ink', primary: '#b9a7ff', secondary: '#0f1637' },
  { id: 'emerald_mint', primary: '#0f8a6a', secondary: '#b8f3df' },
] as const

function normalizeSvgMarkup(raw: string, aspect: 'meet' | 'slice', disableSecondaryStroke: boolean) {
  const withoutScripts = raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  const withScopedStyle = withoutScripts.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (m) =>
    m.replace(/\*\s*\{/g, '.fauna-svg-scope *{'),
  )
  const withoutSecondaryStroke = disableSecondaryStroke
    ? withScopedStyle
        .replace(/stroke\s*:\s*var\(--svg-secondary[^;)]*\)[^;]*;/gi, 'stroke:none !important;')
        .replace(/\sstroke=("var\(--svg-secondary[^"]*\)"|'var\(--svg-secondary[^']*\)')/gi, ' stroke="none"')
    : withScopedStyle
  return withoutSecondaryStroke.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
    const widthMatch = attrs.match(/\bwidth=(".*?"|'.*?')/i)
    const heightMatch = attrs.match(/\bheight=(".*?"|'.*?')/i)
    const rawWidth = widthMatch ? widthMatch[1].slice(1, -1) : ''
    const rawHeight = heightMatch ? heightMatch[1].slice(1, -1) : ''
    const widthNum = Number(rawWidth)
    const heightNum = Number(rawHeight)
    const hasViewBox = /\bviewBox=/i.test(attrs)

    const cleanedAttrs = hasViewBox
      ? attrs.replace(/\s(width|height|preserveAspectRatio)=(".*?"|'.*?')/gi, '')
      : attrs.replace(/\s(width|height|preserveAspectRatio|viewBox)=(".*?"|'.*?')/gi, '')
    const hasStyle = /\sstyle=/.test(cleanedAttrs)
    const styleAppend = hasStyle ? '' : ' style="display:block;width:100%;height:100%;"'
    const classedAttrs = /\bclass=/.test(cleanedAttrs)
      ? cleanedAttrs.replace(/\bclass=(".*?"|'.*?')/i, (cm: string) => cm.slice(0, -1) + ' fauna-svg-scope' + cm.slice(-1))
      : `${cleanedAttrs} class="fauna-svg-scope"`

    const injectedViewBox =
      hasViewBox
        ? ''
        : Number.isFinite(widthNum) && widthNum > 0 && Number.isFinite(heightNum) && heightNum > 0
          ? ` viewBox="0 0 ${widthNum} ${heightNum}"`
          : ''

    return `<svg${classedAttrs}${styleAppend}${injectedViewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid ${aspect}">`
  })
}

function SvgTile({
  url,
  variantId,
  stripThemeStyle,
  primary,
  secondary,
}: {
  url: string
  variantId: 'current' | 'potrace' | 'centerline'
  stripThemeStyle: boolean
  primary?: string
  secondary?: string
}) {
  const [markup, setMarkup] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setMarkup(null)
    setFailed(false)

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch svg (${r.status})`)
        return r.text()
      })
      .then((text) => {
        if (cancelled) return
        const aspect = variantId === 'centerline' ? 'meet' : 'slice'
        const normalized = normalizeSvgMarkup(text, aspect, variantId !== 'centerline')
        const toRender = stripThemeStyle
          ? normalized.replace(/<style\b[^>]*>[\s\S]*?--svg-(primary|secondary)[\s\S]*?<\/style>/gi, '')
          : normalized
        setMarkup(toRender)
      })
      .catch(() => {
        if (cancelled) return
        setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [url, variantId])

  if (failed) return null
  if (!markup) return <div className="absolute inset-0 bg-white/10" />

  return (
    <div
      className="absolute inset-0"
      style={stripThemeStyle ? undefined : {
        ['--svg-primary' as any]: primary,
        ['--svg-secondary' as any]: secondary,
      }}
    >
      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: markup }} />
    </div>
  )
}

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isPro } = useAuth()
  const [showPricingModal, setShowPricingModal] = useState(false)

  const assetId = params.id as string
  const asset = getAssetById(assetId)
  const collection = asset ? getCollectionById(asset.collectionId) : null

  if (!asset) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2a2618' }}>
        <div className="text-center">
          <h1 className="text-2xl font-serif text-white mb-2">Asset not found</h1>
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

  const canDownload = asset.isFree || isPro
  const displayTitle = asset.title
    .replace(/^Manual No\.\s*\d+\s+/i, '')
    .replace(new RegExp(`^${collection?.title}\\s+`, 'i'), '')
    .trim()

  type VariantId = 'png' | 'current' | 'potrace' | 'centerline'

  const currentSvgUrl = asset.metadata?.svgUrl
  const potraceSvgUrl = asset.metadata?.svgPotraceUrl
  const centerlineSvgUrl = asset.metadata?.svgCenterlineUrl
  const svgCacheBust = 'v=7'
  const withSvgBust = (url?: string) => url ? `${url}${url.includes('?') ? '&' : '?'}${svgCacheBust}` : undefined

  const [compareMode, setCompareMode] = useState(false)
  const [activeVariant, setActiveVariant] = useState<VariantId>(() => (potraceSvgUrl ? 'potrace' : currentSvgUrl ? 'current' : 'png'))

  const activeSvgUrl =
    activeVariant === 'current'
      ? withSvgBust(currentSvgUrl)
      : activeVariant === 'potrace'
        ? withSvgBust(potraceSvgUrl)
        : activeVariant === 'centerline'
          ? withSvgBust(centerlineSvgUrl)
          : undefined

  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null)
  const [svgFailed, setSvgFailed] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState<(typeof COLOR_PRESETS)[number]['id']>('default')
  const mediaRef = useRef<HTMLDivElement | null>(null)
  const downloadButtonRef = useRef<HTMLButtonElement | null>(null)
  const backButtonRef = useRef<HTMLButtonElement | null>(null)

  const selectedPreset = COLOR_PRESETS.find(p => p.id === selectedPresetId) ?? COLOR_PRESETS[0]
  const isDefaultColor = selectedPresetId === 'default'
  const hasThemeStyleTag = svgMarkup ? /fill:var\(--svg-primary/i.test(svgMarkup) || /stroke:var\(--svg-secondary/i.test(svgMarkup) : false
  const svgMarkupToRender = isDefaultColor
    ? svgMarkup?.replace(/<style\b[^>]*>[\s\S]*?--svg-(primary|secondary)[\s\S]*?<\/style>/gi, '') ?? null
    : svgMarkup

  useEffect(() => {
    if (!showDownloadMenu) return
    const onPointerDown = (e: PointerEvent) => {
      if (!downloadMenuRef.current) return
      if (!downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showDownloadMenu])

  useEffect(() => {
    let cancelled = false
    setImageLoaded(false)
    setSvgMarkup(null)
    setSvgFailed(false)
    if (!activeSvgUrl) return

    fetch(activeSvgUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch svg (${r.status})`)
        return r.text()
      })
      .then((text) => {
        if (cancelled) return
        const aspect = activeVariant === 'centerline' ? 'meet' : 'slice'
        const normalized = normalizeSvgMarkup(text, aspect, activeVariant !== 'centerline')
        setSvgMarkup(normalized)
        setImageLoaded(true)
      })
      .catch(() => {
        if (cancelled) return
        setSvgFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [activeSvgUrl, activeVariant])

  useLayoutEffect(() => {
    if (!svgMarkupToRender) return
    const root = mediaRef.current
    if (!root) return
    const svg = root.querySelector('svg') as SVGElement | null
    const svgBox = svg?.getBoundingClientRect()
    const rootBox = root.getBoundingClientRect()
    const svgAttrs = svg
      ? {
          viewBox: svg.getAttribute('viewBox'),
          width: svg.getAttribute('width'),
          height: svg.getAttribute('height'),
          preserveAspectRatio: svg.getAttribute('preserveAspectRatio'),
        }
      : null
    const primary = getComputedStyle(root).getPropertyValue('--svg-primary').trim()
    const secondary = getComputedStyle(root).getPropertyValue('--svg-secondary').trim()
    const firstShape = svg ? (svg.querySelector('path,rect,circle,ellipse,polygon,polyline') as SVGElement | null) : null
    const firstFill = firstShape ? getComputedStyle(firstShape as any).fill : null
    const firstStroke = firstShape ? getComputedStyle(firstShape as any).stroke : null
  }, [assetId, svgMarkupToRender, selectedPresetId, isDefaultColor])

  const downloadFile = async (url: string, filename: string) => {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to download (${res.status})`)
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  }

  const handleDownloadClick = () => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!isPro && !asset.isFree) {
      setShowPricingModal(true)
      return
    }
    setShowDownloadMenu((v) => !v)
  }

  const handleDownloadFormat = async (format: 'png') => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!isPro && !asset.isFree) {
      setShowPricingModal(true)
      return
    }
    setShowDownloadMenu(false)

    try {
      if (format === 'png') {
        await downloadFile(asset.imageUrl, `${asset.id}.png`)
      } else {
        alert('SVG download is currently unavailable')
      }
    } catch {
      alert('Download failed')
    }
  }

  return (
    <>
      <div className="pt-16 min-h-screen" style={{ backgroundColor: '#2a2618' }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <button
            onClick={() => router.push('/app')}
            ref={backButtonRef}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            aria-label="Back to app"
          >
            <IconArrowLeft size={18} strokeWidth={1.5} />
            <span className="text-sm font-light">Back</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
            <div>
              <div
                className="relative w-full aspect-square overflow-hidden"
                style={{ backgroundColor: svgMarkup ? '#ffffff' : 'rgba(255, 255, 255, 0.04)' }}
              >
                {!imageLoaded && <Skeleton className="absolute inset-0 bg-white/10" />}
                {svgMarkup ? (
                <div
                  ref={mediaRef}
                  className="w-full h-full flex items-center justify-center relative group"
                  style={isDefaultColor ? undefined : {
                    ['--svg-primary' as any]: (selectedPreset as any).primary,
                    ['--svg-secondary' as any]: (selectedPreset as any).secondary,
                  }}
                >
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: svgMarkupToRender ?? '' }}
                  />
                  <img
                    src={asset.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  />
                </div>
                ) : (
                  <img
                    src={asset.imageUrl}
                    alt={asset.title}
                    className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(true)}
                  />
                )}
              </div>

              {compareMode && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {([
                    { id: 'png' as const, label: 'Original', url: asset.imageUrl, isSvg: false },
                    { id: 'current' as const, label: 'Current', url: withSvgBust(currentSvgUrl), isSvg: true },
                    { id: 'potrace' as const, label: 'Potrace', url: withSvgBust(potraceSvgUrl), isSvg: true },
                    { id: 'centerline' as const, label: 'Centerline', url: withSvgBust(centerlineSvgUrl), isSvg: true },
                  ]).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVariant(v.id)}
                      className="text-left"
                      aria-label={`Select ${v.label}`}
                    >
                      <div
                        className="relative w-full aspect-square overflow-hidden border"
                        style={{
                          borderRadius: 0,
                          borderColor: activeVariant === v.id ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)',
                          backgroundColor: v.isSvg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        {v.url ? (
                          v.isSvg ? (
                            <SvgTile
                              url={v.url}
                              variantId={v.id as 'current' | 'potrace' | 'centerline'}
                              stripThemeStyle={isDefaultColor}
                              primary={(selectedPreset as any).primary}
                              secondary={(selectedPreset as any).secondary}
                            />
                          ) : (
                            <img
                              src={v.url}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )
                        ) : null}
                      </div>
                      <div className="mt-2 text-[11px] font-light tracking-wider text-white/60 uppercase">{v.label}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-white">
              {!imageLoaded ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-72 bg-white/10" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20 bg-white/10" />
                    <Skeleton className="h-4 w-48 bg-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-white/10" />
                    <Skeleton className="h-4 w-full max-w-sm bg-white/10" />
                    <Skeleton className="h-4 w-full max-w-xs bg-white/10" />
                  </div>
                  <Skeleton className="w-12 h-12 bg-white/10 border border-white/10" />
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-light mb-8">{displayTitle}</h1>

                  {collection && (
                    <div className="mb-8">
                      <div className="text-[11px] font-light tracking-wider text-white/50 uppercase mb-2">Collection</div>
                      <div className="text-sm font-light">{collection.title}</div>
                    </div>
                  )}

                  <details className="border-t border-white/10 pt-6">
                    <summary className="text-sm font-light text-white/80 cursor-pointer select-none flex items-center justify-between">
                      <span>Details</span>
                      <IconChevronDown size={18} strokeWidth={1.5} className="text-white/80" />
                    </summary>
                    <div className="mt-6 space-y-6">
                      <div>
                        <div className="text-[11px] font-light tracking-wider text-white/50 uppercase mb-2">Availability</div>
                        <div className="text-sm font-light">{asset.isFree ? 'Free' : 'Pro'}</div>
                      </div>
                      {asset.conceptType && (
                        <div>
                          <div className="text-[11px] font-light tracking-wider text-white/50 uppercase mb-2">Concept type</div>
                          <div className="text-sm font-light">{asset.conceptType}</div>
                        </div>
                      )}
                    </div>
                  </details>

                  {svgMarkup && !svgFailed && (
                    <div className="mt-8">
                      <div className="text-[11px] font-light tracking-wider text-white/50 uppercase mb-3">COLOR</div>
                      <div className="flex gap-3">
                        {COLOR_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPresetId(p.id)}
                            aria-label={`Color preset ${p.id}`}
                            className="w-12 h-12 border transition-colors"
                            style={{
                              borderRadius: 0,
                              background: p.id === 'default'
                                ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.08) 100%)'
                                : `linear-gradient(135deg, ${(p as any).primary} 0%, ${(p as any).primary} 50%, ${(p as any).secondary} 50%, ${(p as any).secondary} 100%)`,
                              borderColor: selectedPresetId === p.id ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <button
                      onClick={() => setCompareMode((v) => !v)}
                      className="text-sm font-light text-white/80 hover:text-white transition-colors"
                    >
                      {compareMode ? 'Hide compare' : 'Compare tracing'}
                    </button>
                  </div>

                  <div className="mt-10">
                    <div className="relative inline-block" ref={downloadMenuRef}>
                      <button
                        onClick={handleDownloadClick}
                        ref={downloadButtonRef}
                        className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center"
                        style={{ borderRadius: 0 }}
                        aria-label="Download"
                      >
                        <IconDownload size={18} strokeWidth={1.5} className="text-white" />
                      </button>

                      {showDownloadMenu && (
                        <div
                          className="absolute right-0 mt-2 min-w-[140px] bg-[#2a2618] border border-white/15 shadow-lg"
                          style={{ borderRadius: 0 }}
                        >
                          <button
                            onClick={() => handleDownloadFormat('png')}
                            className="w-full px-4 py-3 text-left text-sm font-light text-white/90 hover:bg-white/10 transition-colors"
                          >
                            PNG
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
      />
    </>
  )
}
