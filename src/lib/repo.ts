import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { makeThumbnail } from './thumbnail'
import type { Category, Item, Outfit, Wardrobe, WardrobeEntryKind } from '../types'

export async function addItem(
  image: Blob,
  category: Category,
  name?: string,
  purchasedFrom?: string,
  price?: number,
): Promise<Item> {
  const thumbnail = await makeThumbnail(image)
  const item: Item = {
    id: uuid(),
    category,
    image,
    thumbnail,
    name: name?.trim() || undefined,
    purchasedFrom: purchasedFrom?.trim() || undefined,
    price: price !== undefined && !Number.isNaN(price) ? price : undefined,
    createdAt: Date.now(),
  }
  await db.items.add(item)
  return item
}

export async function updateItem(
  id: string,
  updates: Partial<Pick<Item, 'category' | 'name' | 'purchasedFrom' | 'price'>>,
) {
  await db.items.update(id, updates)
}

export async function recropItem(id: string, image: Blob) {
  const thumbnail = await makeThumbnail(image)
  await db.items.update(id, { image, thumbnail })
}

function referencesItem(outfit: Outfit, itemId: string) {
  return (
    outfit.hatId === itemId ||
    outfit.topId === itemId ||
    outfit.bottomId === itemId ||
    outfit.dressId === itemId ||
    outfit.shoesId === itemId ||
    outfit.bagId === itemId
  )
}

async function pruneEntriesReferencing(kind: WardrobeEntryKind, refIds: Set<string>) {
  if (refIds.size === 0) return
  const wardrobes = await db.wardrobes.toArray()
  for (const wardrobe of wardrobes) {
    const filtered = wardrobe.entries.filter((e) => !(e.kind === kind && refIds.has(e.refId)))
    if (filtered.length !== wardrobe.entries.length) {
      await db.wardrobes.update(wardrobe.id, { entries: filtered })
    }
  }
}

export async function deleteItem(id: string) {
  await db.transaction('rw', db.items, db.outfits, db.wardrobes, async () => {
    const affectedOutfits = await db.outfits.filter((o) => referencesItem(o, id)).toArray()
    const affectedOutfitIds = new Set(affectedOutfits.map((o) => o.id))
    await db.outfits.bulkDelete([...affectedOutfitIds])
    await pruneEntriesReferencing('outfit', affectedOutfitIds)
    await pruneEntriesReferencing('item', new Set([id]))
    await db.items.delete(id)
  })
}

type OutfitSlots = Pick<
  Outfit,
  'hatId' | 'topId' | 'bottomId' | 'dressId' | 'shoesId' | 'bagId'
>

function sameOutfit(a: OutfitSlots, b: Outfit) {
  return (
    a.hatId === b.hatId &&
    a.topId === b.topId &&
    a.bottomId === b.bottomId &&
    a.dressId === b.dressId &&
    a.shoesId === b.shoesId &&
    a.bagId === b.bagId
  )
}

export async function findDuplicateOutfit(candidate: OutfitSlots): Promise<Outfit | undefined> {
  const all = await db.outfits.toArray()
  return all.find((o) => sameOutfit(candidate, o))
}

export async function saveOutfit(candidate: OutfitSlots, name?: string): Promise<Outfit> {
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
  await db.transaction('rw', db.outfits, db.wardrobes, async () => {
    await pruneEntriesReferencing('outfit', new Set([id]))
    await db.outfits.delete(id)
  })
}

export async function createWardrobe(name: string): Promise<Wardrobe> {
  const wardrobe: Wardrobe = {
    id: uuid(),
    name: name.trim() || 'Untitled wardrobe',
    entries: [],
    packingMode: false,
    createdAt: Date.now(),
  }
  await db.wardrobes.add(wardrobe)
  return wardrobe
}

export async function renameWardrobe(id: string, name: string) {
  await db.wardrobes.update(id, { name: name.trim() || 'Untitled wardrobe' })
}

export async function deleteWardrobe(id: string) {
  await db.wardrobes.delete(id)
}

export async function setWardrobePackingMode(id: string, packingMode: boolean) {
  await db.wardrobes.update(id, { packingMode })
}

export async function addWardrobeEntry(wardrobeId: string, kind: WardrobeEntryKind, refId: string) {
  const wardrobe = await db.wardrobes.get(wardrobeId)
  if (!wardrobe) return
  if (wardrobe.entries.some((e) => e.kind === kind && e.refId === refId)) return
  const entry = { id: uuid(), kind, refId, packed: false }
  await db.wardrobes.update(wardrobeId, { entries: [...wardrobe.entries, entry] })
}

export async function removeWardrobeEntry(wardrobeId: string, entryId: string) {
  const wardrobe = await db.wardrobes.get(wardrobeId)
  if (!wardrobe) return
  await db.wardrobes.update(wardrobeId, {
    entries: wardrobe.entries.filter((e) => e.id !== entryId),
  })
}

export async function toggleWardrobeEntry(wardrobeId: string, entryId: string) {
  const wardrobe = await db.wardrobes.get(wardrobeId)
  if (!wardrobe) return
  await db.wardrobes.update(wardrobeId, {
    entries: wardrobe.entries.map((e) => (e.id === entryId ? { ...e, packed: !e.packed } : e)),
  })
}
