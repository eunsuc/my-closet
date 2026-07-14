import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { makeThumbnail } from './thumbnail'
import type { Category, Item, Outfit } from '../types'

export async function addItem(image: Blob, category: Category, name?: string): Promise<Item> {
  const thumbnail = await makeThumbnail(image)
  const item: Item = {
    id: uuid(),
    category,
    image,
    thumbnail,
    name: name?.trim() || undefined,
    createdAt: Date.now(),
  }
  await db.items.add(item)
  return item
}

export async function updateItem(id: string, updates: Partial<Pick<Item, 'category' | 'name'>>) {
  await db.items.update(id, updates)
}

export async function deleteItem(id: string) {
  await db.transaction('rw', db.items, db.outfits, async () => {
    await db.outfits
      .filter((o) => o.dressId === id || o.shirtId === id || o.skirtId === id)
      .delete()
    await db.items.delete(id)
  })
}

function sameOutfit(a: Partial<Outfit>, b: Outfit) {
  return a.dressId === b.dressId && a.shirtId === b.shirtId && a.skirtId === b.skirtId
}

export async function findDuplicateOutfit(
  candidate: Pick<Outfit, 'dressId' | 'shirtId' | 'skirtId'>,
): Promise<Outfit | undefined> {
  const all = await db.outfits.toArray()
  return all.find((o) => sameOutfit(candidate, o))
}

export async function saveOutfit(
  candidate: Pick<Outfit, 'dressId' | 'shirtId' | 'skirtId'>,
  name?: string,
): Promise<Outfit> {
  const existing = await findDuplicateOutfit(candidate)
  if (existing) return existing
  const outfit: Outfit = {
    id: uuid(),
    ...candidate,
    name: name?.trim() || undefined,
    createdAt: Date.now(),
  }
  await db.outfits.add(outfit)
  return outfit
}

export async function deleteOutfit(id: string) {
  await db.outfits.delete(id)
}
