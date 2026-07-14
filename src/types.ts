export type Category = 'dress' | 'shirt' | 'skirt'

export interface Item {
  id: string
  category: Category
  image: Blob
  thumbnail: Blob
  name?: string
  createdAt: number
}

export interface Outfit {
  id: string
  dressId?: string
  shirtId?: string
  skirtId?: string
  name?: string
  createdAt: number
}
