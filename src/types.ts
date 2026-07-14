export type Category = 'hat' | 'top' | 'bottom' | 'dress' | 'shoes' | 'bag'

export interface Item {
  id: string
  category: Category
  image: Blob
  thumbnail: Blob
  name?: string
  purchasedFrom?: string
  price?: number
  color?: string
  createdAt: number
}

export interface Outfit {
  id: string
  hatId?: string
  topId?: string
  bottomId?: string
  dressId?: string
  shoesId?: string
  bagId?: string
  name?: string
  createdAt: number
}

export type WardrobeEntryKind = 'outfit' | 'item'

export interface WardrobeEntry {
  id: string
  kind: WardrobeEntryKind
  refId: string
  packed: boolean
}

export interface Wardrobe {
  id: string
  name: string
  entries: WardrobeEntry[]
  packingMode: boolean
  createdAt: number
}
