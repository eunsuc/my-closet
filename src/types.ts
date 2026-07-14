export type Category = 'hat' | 'top' | 'bottom' | 'dress' | 'shoes'

export interface Item {
  id: string
  category: Category
  image: Blob
  thumbnail: Blob
  name?: string
  purchasedFrom?: string
  createdAt: number
}

export interface Outfit {
  id: string
  hatId?: string
  topId?: string
  bottomId?: string
  dressId?: string
  shoesId?: string
  name?: string
  createdAt: number
}

export type PackingEntryKind = 'outfit' | 'item'

export interface PackingEntry {
  id: string
  kind: PackingEntryKind
  refId: string
  packed: boolean
}

export interface PackingList {
  id: string
  name: string
  entries: PackingEntry[]
  createdAt: number
}
