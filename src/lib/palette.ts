import { Palette } from './types'

export const defaultSitePalette: Palette = {
  bg: '#ffffff',
  fg: '#000000',
}

export const applyPalette = (palette: Palette) => {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  root.style.setProperty('--bg', palette.bg || '#ffffff')
  root.style.setProperty('--fg', palette.fg)
  // Keep legacy CSS vars for backward compatibility with existing styles
  root.style.setProperty('--muted', palette.fg + '80') // 50% opacity
  root.style.setProperty('--divider', palette.bg ? adjustBrightness(palette.bg, -0.1) : '#e5e5e5')
  root.style.setProperty('--accent', palette.fg)
  root.style.setProperty('--accent2', palette.fg + 'cc') // 80% opacity
}

function adjustBrightness(hex: string, percent: number): string {
  // Simple brightness adjustment - just return a default for now
  return '#e5e5e5'
}

export const resetPalette = () => {
  applyPalette(defaultSitePalette)
}
