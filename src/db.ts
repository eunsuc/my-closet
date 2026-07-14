import Dexie, { type EntityTable } from 'dexie'
import type { Item, Outfit, PackingList } from './types'

export const db = new Dexie('closet') as Dexie & {
  items: EntityTable<Item, 'id'>
  outfits: EntityTable<Outfit, 'id'>
  packingLists: EntityTable<PackingList, 'id'>
}

db.version(1).stores({
  items: 'id, category, createdAt',
  outfits: 'id, createdAt',
})

db.version(2)
  .stores({
    items: 'id, category, createdAt',
    outfits: 'id, createdAt',
    packingLists: 'id, createdAt',
  })
  .upgrade(async (tx) => {
    await tx
      .table('items')
      .toCollection()
      .modify((item) => {
        if (item.category === 'shirt') item.category = 'top'
        if (item.category === 'skirt') item.category = 'bottom'
      })
    await tx
      .table('outfits')
      .toCollection()
      .modify((outfit) => {
        if (outfit.shirtId) {
          outfit.topId = outfit.shirtId
          delete outfit.shirtId
        }
        if (outfit.skirtId) {
          outfit.bottomId = outfit.skirtId
          delete outfit.skirtId
        }
      })
  })

if (navigator.storage?.persist) {
  navigator.storage.persist()
}
