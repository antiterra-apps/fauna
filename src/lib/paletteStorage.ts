import { UserPalette } from './types'

// TODO: Replace with actual database
const userPalettes: Map<string, Map<string, UserPalette>> = new Map()

export function getUserPalettes(userId: string): Map<string, UserPalette> {
  if (!userPalettes.has(userId)) {
    userPalettes.set(userId, new Map())
  }
  return userPalettes.get(userId)!
}

export function getPalette(userId: string, paletteId: string): UserPalette | undefined {
  return getUserPalettes(userId).get(paletteId)
}

export function setPalette(userId: string, palette: UserPalette): void {
  getUserPalettes(userId).set(palette.id, palette)
}

export function deletePalette(userId: string, paletteId: string): boolean {
  return getUserPalettes(userId).delete(paletteId)
}

export function hasPalette(userId: string, paletteId: string): boolean {
  return getUserPalettes(userId).has(paletteId)
}
