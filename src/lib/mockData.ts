import { Collection, Asset } from './types'

const defaultPalette = {
  bg: '#ffffff',
  fg: '#000000',
  muted: '#666666',
  divider: '#e5e5e5',
  accent: '#000000',
  accent2: '#333333',
}

const darkPalette = {
  bg: '#0a0a0a',
  fg: '#ffffff',
  muted: '#999999',
  divider: '#333333',
  accent: '#ffffff',
  accent2: '#cccccc',
}

const warmPalette = {
  bg: '#faf8f5',
  fg: '#2d2416',
  muted: '#8b7355',
  divider: '#e8ddd0',
  accent: '#8b4513',
  accent2: '#a0522d',
}

const coolPalette = {
  bg: '#f5f7fa',
  fg: '#1a2332',
  muted: '#5a6c7d',
  divider: '#d1d9e3',
  accent: '#2c5282',
  accent2: '#4a90a4',
}

const generateAssets = (collectionId: string, totalCount: number, previewCount: number = 5): Asset[] => {
  const assets: Asset[] = []
  const imageIds = [
    '1441974231531-a62220982b86', '1472214103451-9374bd1c798e', '1517849845447-4d7f90945947',
    '1505142468610-359e7d316be0', '1522276498395-f4f68f7f8454', '1514888286974-6c03e9ca9fe4',
    '1517849845447-4d7f90945947', '1505142468610-359e7d316be0', '1522276498395-f4f68f7f8454',
    '1514888286974-6c03e9ca9fe4', '1441974231531-a62220982b86', '1472214103451-9374bd1c798e',
    '1505142468610-359e7d316be0', '1522276498395-f4f68f7f8454', '1514888286974-6c03e9ca9fe4',
  ]
  for (let i = 0; i < totalCount; i++) {
    assets.push({
      id: `${collectionId}-${i + 1}`,
      title: `${collectionId.charAt(0).toUpperCase() + collectionId.slice(1)} Asset ${i + 1}`,
      imageUrl: `https://images.unsplash.com/photo-${imageIds[i % imageIds.length]}?w=400&h=300&fit=crop`,
      isFree: i < previewCount,
      collectionId,
      conceptType: ['Icon', 'Illustration', 'Pattern', 'Texture'][Math.floor(Math.random() * 4)],
    })
  }
  return assets
}

export const mockCollections: Collection[] = [
  {
    id: 'wildlife',
    title: 'Wildlife',
    description: 'Natural fauna illustrations and icons',
    defaultPalette: warmPalette,
    tag: 'Popular',
    assets: generateAssets('wildlife', 25, 5),
  },
  {
    id: 'marine',
    title: 'Marine Life',
    description: 'Ocean creatures and underwater scenes',
    defaultPalette: coolPalette,
    assets: generateAssets('marine', 30, 5),
  },
  {
    id: 'birds',
    title: 'Birds',
    description: 'Avian species in various styles',
    defaultPalette: defaultPalette,
    tag: 'New',
    assets: generateAssets('birds', 28, 5),
  },
  {
    id: 'nocturnal',
    title: 'Nocturnal',
    description: 'Creatures of the night',
    defaultPalette: darkPalette,
    assets: generateAssets('nocturnal', 22, 5),
  },
  {
    id: 'insects',
    title: 'Insects',
    description: 'Detailed insect illustrations',
    defaultPalette: warmPalette,
    assets: generateAssets('insects', 35, 5),
  },
  {
    id: 'reptiles',
    title: 'Reptiles',
    description: 'Scaled and slithering',
    defaultPalette: coolPalette,
    assets: generateAssets('reptiles', 20, 5),
  },
]

export const getAllAssets = (): Asset[] => {
  return mockCollections.flatMap(c => c.assets)
}

export const getAssetById = (id: string): Asset | undefined => {
  return getAllAssets().find(a => a.id === id)
}

export const getCollectionById = (id: string): Collection | undefined => {
  return mockCollections.find(c => c.id === id)
}
