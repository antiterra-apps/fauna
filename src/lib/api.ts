import { Asset, Collection } from './types'

// API stubs - to be replaced with actual backend calls

export const api = {
  async getCollections(): Promise<Collection[]> {
    // TODO: Replace with actual API call
    return Promise.resolve([])
  },

  async getCollection(id: string): Promise<Collection | null> {
    // TODO: Replace with actual API call
    return Promise.resolve(null)
  },

  async getAsset(id: string): Promise<Asset | null> {
    // TODO: Replace with actual API call
    return Promise.resolve(null)
  },

  async searchAssets(query: string): Promise<Asset[]> {
    // TODO: Replace with actual API call
    return Promise.resolve([])
  },

  async downloadAsset(assetId: string): Promise<Blob> {
    // TODO: Replace with actual API call
    throw new Error('Not implemented')
  },

  async generateImage(prompt: string): Promise<Asset> {
    // TODO: Replace with actual image generation API call
    throw new Error('Not implemented')
  },

  async trainLoRA(name: string, images: File[]): Promise<string> {
    // TODO: Replace with actual LoRA training API call
    throw new Error('Not implemented')
  },
}
