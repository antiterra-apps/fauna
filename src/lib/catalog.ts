import { Asset, Collection } from './types'

const warmPalette = {
  bg: '#faf8f5',
  fg: '#2d2416',
  muted: '#8b7355',
  divider: '#e8ddd0',
  accent: '#8b4513',
  accent2: '#a0522d',
}

const engineersManualAssets: Asset[] = [
  {
    id: 'engineers-manual-1',
    title: 'Manual No. 1 Collaboration 01',
    imageUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_collaboration_01.png",
    isFree: true,
    collectionId: 'engineers-manual',
    conceptType: 'Illustration',
    metadata: {
      blobUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_collaboration_01.png",
      svgUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/engineers-manual-1.svg",
      svgPotraceUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-1-potrace.svg",
      svgCenterlineUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-1-outline.svg",
    },
  },
  {
    id: 'engineers-manual-2',
    title: 'Manual No. 1 Access 01',
    imageUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_access_01.png",
    isFree: true,
    collectionId: 'engineers-manual',
    conceptType: 'Illustration',
    metadata: {
      blobUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_access_01.png",
      svgUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/engineers-manual-2.svg",
      svgPotraceUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-2-potrace.svg",
      svgCenterlineUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-2-outline.svg",
    },
  },
  {
    id: 'engineers-manual-3',
    title: 'Manual No. 1 Infrastructure 02',
    imageUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_infrastructure_02.png",
    isFree: true,
    collectionId: 'engineers-manual',
    conceptType: 'Illustration',
    metadata: {
      blobUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_infrastructure_02.png",
      svgUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/engineers-manual-3.svg",
      svgPotraceUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-3-potrace.svg",
      svgCenterlineUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-3-outline.svg",
    },
  },
  {
    id: 'engineers-manual-4',
    title: 'Manual No. 1 Infrastructure 04',
    imageUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_infrastructure_04.png",
    isFree: true,
    collectionId: 'engineers-manual',
    conceptType: 'Illustration',
    metadata: {
      blobUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/Engineer%27s%20Manual/manual_no_1_infrastructure_04.png",
      svgUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/engineers-manual-4.svg",
      svgPotraceUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-4-potrace.svg",
      svgCenterlineUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/svg/variants/engineers-manual-4-outline.svg",
    },
  },
]

export const collections: Collection[] = [
  {
    id: 'engineers-manual',
    title: "Engineer's Manual",
    description: '',
    defaultPalette: warmPalette,
    assets: engineersManualAssets,
  },
]

export function getAllAssets(): Asset[] {
  return collections.flatMap(c => c.assets)
}

export function getAssetById(id: string): Asset | undefined {
  return getAllAssets().find(a => a.id === id)
}

export function getCollectionById(id: string): Collection | undefined {
  return collections.find(c => c.id === id)
}

export function getAssetsForCollection(collectionId: string): Asset[] {
  return getAllAssets().filter(a => a.collectionId === collectionId)
}

