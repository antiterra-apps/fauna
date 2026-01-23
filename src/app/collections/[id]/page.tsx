'use client'

import { useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IconArrowLeft, IconMoon, IconSun } from '@tabler/icons-react'
import { getCollectionById, getAssetsForCollection, brownLight, brownDark, navyLight, navyDark, rustLight, rustDark, lavenderLight, lavenderDark, emeraldLight, emeraldDark } from '@/lib/catalog'
import { AssetCard } from '@/components/AssetCard'
import { useColorSelector } from '@/contexts/ColorSelectorContext'

const COLOR_PRESETS = [
  { id: 'brown_light', primary: brownLight.fg, secondary: brownLight.bg, primaryLight: brownDark.fg, secondaryLight: brownDark.bg },
  { id: 'navy_light', primary: navyLight.fg, secondary: navyLight.bg, primaryLight: navyDark.fg, secondaryLight: navyDark.bg },
  { id: 'rust_light', primary: rustLight.fg, secondary: rustLight.bg, primaryLight: rustDark.fg, secondaryLight: rustDark.bg },
  { id: 'lavender_light', primary: lavenderLight.fg, secondary: lavenderLight.bg, primaryLight: lavenderDark.fg, secondaryLight: lavenderDark.bg },
  { id: 'emerald_light', primary: emeraldLight.fg, secondary: emeraldLight.bg, primaryLight: emeraldDark.fg, secondaryLight: emeraldDark.bg },
] as const

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string
  const collection = getCollectionById(collectionId)
  const assets = collection ? getAssetsForCollection(collectionId) : []
  const colorSelector = useColorSelector()
  const colorSelectorRef = useRef<HTMLDivElement>(null)
  
  const selectedPreset = COLOR_PRESETS.find(p => p.id === colorSelector.selectedPresetId) ?? COLOR_PRESETS[0]
  const primaryColor = colorSelector.isDarkMode ? selectedPreset.primaryLight : selectedPreset.primary
  const secondaryColor = colorSelector.isDarkMode ? selectedPreset.secondaryLight : selectedPreset.secondary

  useEffect(() => {
    colorSelector.setIsCollectionPage(true)
    return () => {
      colorSelector.setIsCollectionPage(false)
      colorSelector.setScrollProgress(0)
    }
  }, [colorSelector])

  useEffect(() => {
    const handleScroll = () => {
      if (!colorSelectorRef.current) return
      
      const scrollY = window.scrollY
      const startOffset = 400 // Start transitioning after 400px scroll
      const transitionRange = 300 // Transition over 300px
      
      const progress = Math.max(0, Math.min(1, (scrollY - startOffset) / transitionRange))
      colorSelector.setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [colorSelector])

  if (!collection) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2a2618' }}>
        <div className="text-center">
          <h1 className="text-2xl font-serif text-white mb-2">Collection not found</h1>
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#2a2618' }}>
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back()
              } else {
                router.push('/app')
              }
            }}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
            aria-label="Back"
          >
            <IconArrowLeft size={18} strokeWidth={1.5} />
            <span className="text-sm font-light">Back</span>
          </button>

          <div className="mb-8 mt-6">
            <h1 className="text-4xl font-alegreya text-white">{collection.title}</h1>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8">
              <div className="max-w-2xl">
                <p className="text-white/60 text-lg leading-relaxed font-light">
                  Engineer's Manual is Fauna's first collection. Sober yet warm, it recalls an older era when illustrations were meticulously drawn by hand with a simple faith in the act of drawing itself. Imperfect lines carry the charm of a poorly printed yet well-loved book. Imageries are calm and restrained to allow the viewer's imagination to linger.
                </p>
              </div>
              <div className="space-y-6 min-w-[200px] max-w-[240px]">
                <div>
                  <div className="text-[11px] font-light tracking-wider text-white/50 uppercase mb-2">No. of images</div>
                  <div className="text-sm font-light text-white">{collection.assetCount}</div>
                </div>
                {collection.styleDescriptors && collection.styleDescriptors.length > 0 && (
                  <div>
                    <div className="text-[11px] font-light tracking-wider text-white/50 uppercase mb-2">Style</div>
                    <div className="text-sm font-light text-white">{collection.styleDescriptors.join(', ')}</div>
                  </div>
                )}
                <div>
                  <div className="text-[11px] font-light tracking-wider text-white/50 uppercase mb-2">Type</div>
                  <div className="text-sm font-light text-white capitalize">{collection.styleContract.type}</div>
                </div>
                {collection.styleContract.allowedFormats && collection.styleContract.allowedFormats.length > 0 && (
                  <div>
                    <div className="text-[11px] font-light tracking-wider text-white/50 uppercase mb-2">Formats</div>
                    <div className="text-sm font-light text-white uppercase">{collection.styleContract.allowedFormats.join(', ')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div 
            ref={colorSelectorRef}
            className="mb-6 transition-opacity duration-300"
            style={{ 
              opacity: colorSelector ? Math.max(0, 1 - colorSelector.scrollProgress * 1.2) : 1,
              pointerEvents: colorSelector && colorSelector.scrollProgress > 0.8 ? 'none' : 'auto'
            }}
          >
            <div className="text-[11px] font-light tracking-wider text-white/50 uppercase mb-3">COLOR</div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => colorSelector.setIsDarkMode(!colorSelector.isDarkMode)}
                aria-label="Toggle dark mode"
                className="w-9 h-9 border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:bg-white/20"
                style={{ borderRadius: 0 }}
              >
                {colorSelector.isDarkMode ? (
                  <IconSun size={18} strokeWidth={1.5} className="text-white" />
                ) : (
                  <IconMoon size={18} strokeWidth={1.5} className="text-white" />
                )}
              </button>
              <div className="flex gap-3">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => colorSelector.setSelectedPresetId(p.id)}
                    aria-label={`Color preset ${p.id}`}
                    className="w-9 h-9 border transition-colors"
                    style={{
                      borderRadius: 0,
                      backgroundColor: (p as any).primary,
                      borderColor: colorSelector.selectedPresetId === p.id ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {assets.map((asset) => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            ))}
          </div>

          {assets.length === 0 && (
            <div className="text-center py-24">
              <p className="text-white/60">No assets found in this collection</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
