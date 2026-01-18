import { Palette } from './types'

export const defaultSitePalette: Palette = {
  bg: '#ffffff',
  fg: '#000000',
  muted: '#666666',
  divider: '#e5e5e5',
  accent: '#000000',
  accent2: '#333333',
}

export const applyPalette = (palette: Palette) => {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  root.style.setProperty('--bg', palette.bg)
  root.style.setProperty('--fg', palette.fg)
  root.style.setProperty('--muted', palette.muted)
  root.style.setProperty('--divider', palette.divider)
  root.style.setProperty('--accent', palette.accent)
  root.style.setProperty('--accent2', palette.accent2)
}

export const resetPalette = () => {
  applyPalette(defaultSitePalette)
}
