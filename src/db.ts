import Dexie, { type EntityTable } from 'dexie'
import type { Item, Outfit } from './types'

export const db = new Dexie('closet') as Dexie & {
  items: EntityTable<Item, 'id'>
  outfits: EntityTable<Outfit, 'id'>
}

db.version(1).stores({
  items: 'id, category, createdAt',
  outfits: 'id, createdAt',
})

if (navigator.storage?.persist) {
  navigator.storage.persist()
}
