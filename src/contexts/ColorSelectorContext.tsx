'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type ColorPresetId = 'brown_light' | 'navy_light' | 'rust_light' | 'lavender_light' | 'emerald_light'

interface ColorSelectorContextType {
  selectedPresetId: ColorPresetId
  setSelectedPresetId: (id: ColorPresetId) => void
  scrollProgress: number
  setScrollProgress: (progress: number) => void
  showInNav: boolean
  isCollectionPage: boolean
  setIsCollectionPage: (isCollection: boolean) => void
  isDarkMode: boolean
  setIsDarkMode: (dark: boolean) => void
}

const ColorSelectorContext = createContext<ColorSelectorContextType | undefined>(undefined)

export function ColorSelectorProvider({ children }: { children: ReactNode }) {
  const [selectedPresetId, setSelectedPresetId] = useState<ColorPresetId>('brown_light')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isCollectionPage, setIsCollectionPage] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const showInNav = isCollectionPage && scrollProgress > 0.1

  return (
    <ColorSelectorContext.Provider
      value={{
        selectedPresetId,
        setSelectedPresetId,
        scrollProgress,
        setScrollProgress,
        showInNav,
        isCollectionPage,
        setIsCollectionPage,
        isDarkMode,
        setIsDarkMode,
      }}
    >
      {children}
    </ColorSelectorContext.Provider>
  )
}

export function useColorSelector() {
  const context = useContext(ColorSelectorContext)
  if (!context) {
    return {
      selectedPresetId: 'brown_light' as ColorPresetId,
      setSelectedPresetId: () => {},
      scrollProgress: 0,
      setScrollProgress: () => {},
      showInNav: false,
      isCollectionPage: false,
      setIsCollectionPage: () => {},
      isDarkMode: false,
      setIsDarkMode: () => {},
    }
  }
  return context
}
