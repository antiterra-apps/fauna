export type Palette = {
  bg?: string;
  fg: string;
}

export type StyleContract = {
  type: 'duotone' | 'multicolor';
  slots: string[];
  allowedFormats: ('webp' | 'png' | 'svg')[];
  allowedSizes: number[];
  defaultFormat: 'webp' | 'png' | 'svg';
  defaultSize: number;
}

export type Collection = {
  id: string;
  title: string;
  description: string;
  assetCount: number;
  styleContract: StyleContract;
  defaultPalette: Palette;
  styleDescriptors: string[];
  availableTags: string[];
  tag?: 'Popular' | 'New';
  assets?: Asset[];
}

export type Asset = {
  id: string;
  title: string;
  imageUrl: string;
  isFree: boolean;
  collectionId: string;
  description: string;
  tags: string[];
  relatedAssets: string[];
  metadata?: {
    blobUrl?: string;
    svgUrl?: string;
    svgPotraceUrl?: string;
    normalizedSvgUrl?: string;
    normalizedPngUrl?: string;
    normalizedWebpUrl?: string;
    createdAt?: string;
    source?: string;
  };
}

export type User = {
  id: string;
  email: string;
  isPro: boolean;
  apiKey?: string;
}

export type UserPalette = {
  id: string;
  name: string;
  colors: Palette;
  createdAt: string;
}
