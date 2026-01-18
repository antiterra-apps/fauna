'use client'

import { useEffect } from 'react'
import { defaultSitePalette, applyPalette } from '@/lib/palette'

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyPalette(defaultSitePalette)
  }, [])

  return <>{children}</>
}
