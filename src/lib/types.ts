export type Palette = {
  bg: string;
  fg: string;
  muted: string;
  divider: string;
  accent: string;
  accent2: string;
}

export type Collection = {
  id: string;
  title: string;
  description: string;
  defaultPalette: Palette;
  tag?: 'Popular' | 'New';
  assets: Asset[];
}

export type Asset = {
  id: string;
  title: string;
  imageUrl: string;
  isFree: boolean;
  collectionId: string;
  conceptType?: string;
  metadata?: {
    blobUrl?: string;
    svgUrl?: string;
    svgPotraceUrl?: string;
    svgCenterlineUrl?: string;
    normalizedPngUrl?: string;
    tags?: string[];
    createdAt?: string;
    source?: string;
  };
}

export type User = {
  id: string;
  email: string;
  isPro: boolean;
}
