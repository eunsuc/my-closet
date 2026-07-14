import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { makeThumbnail } from './thumbnail'
import type { Category, Item, Outfit, PackingEntryKind, PackingList } from '../types'

export async function addItem(
  image: Blob,
  category: Category,
  name?: string,
  purchasedFrom?: string,
): Promise<Item> {
  const thumbnail = await makeThumbnail(image)
  const item: Item = {
    id: uuid(),
    category,
    image,
    thumbnail,
    name: name?.trim() || undefined,
    purchasedFrom: purchasedFrom?.trim() || undefined,
    createdAt: Date.now(),
  }
  await db.items.add(item)
  return item
}

export async function updateItem(
  id: string,
  updates: Partial<Pick<Item, 'category' | 'name' | 'purchasedFrom'>>,
) {
  await db.items.update(id, updates)
}

function referencesItem(outfit: Outfit, itemId: string) {
  return (
    outfit.hatId === itemId ||
    outfit.topId === itemId ||
    outfit.bottomId === itemId ||
    outfit.dressId === itemId ||
    outfit.shoesId === itemId
  )
}

async function pruneEntriesReferencing(kind: PackingEntryKind, refIds: Set<string>) {
  if (refIds.size === 0) return
  const lists = await db.packingLists.toArray()
  for (const list of lists) {
    const filtered = list.entries.filter((e) => !(e.kind === kind && refIds.has(e.refId)))
    if (filtered.length !== list.entries.length) {
      await db.packingLists.update(list.id, { entries: filtered })
    }
  }
}

export async function deleteItem(id: string) {
  await db.transaction('rw', db.items, db.outfits, db.packingLists, async () => {
    const affectedOutfits = await db.outfits.filter((o) => referencesItem(o, id)).toArray()
    const affectedOutfitIds = new Set(affectedOutfits.map((o) => o.id))
    await db.outfits.bulkDelete([...affectedOutfitIds])
    await pruneEntriesReferencing('outfit', affectedOutfitIds)
    await pruneEntriesReferencing('item', new Set([id]))
    await db.items.delete(id)
  })
}

type OutfitSlots = Pick<Outfit, 'hatId' | 'topId' | 'bottomId' | 'dressId' | 'shoesId'>

function sameOutfit(a: OutfitSlots, b: Outfit) {
  return (
    a.hatId === b.hatId &&
    a.topId === b.topId &&
    a.bottomId === b.bottomId &&
    a.dressId === b.dressId &&
    a.shoesId === b.shoesId
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
  await db.transaction('rw', db.outfits, db.packingLists, async () => {
    await pruneEntriesReferencing('outfit', new Set([id]))
    await db.outfits.delete(id)
  })
}

export async function createPackingList(name: string): Promise<PackingList> {
  const list: PackingList = {
    id: uuid(),
    name: name.trim() || 'Untitled trip',
    entries: [],
    createdAt: Date.now(),
  }
  await db.packingLists.add(list)
  return list
}

export async function renamePackingList(id: string, name: string) {
  await db.packingLists.update(id, { name: name.trim() || 'Untitled trip' })
}

export async function deletePackingList(id: string) {
  await db.packingLists.delete(id)
}

export async function addPackingEntry(listId: string, kind: PackingEntryKind, refId: string) {
  const list = await db.packingLists.get(listId)
  if (!list) return
  if (list.entries.some((e) => e.kind === kind && e.refId === refId)) return
  const entry = { id: uuid(), kind, refId, packed: false }
  await db.packingLists.update(listId, { entries: [...list.entries, entry] })
}

export async function removePackingEntry(listId: string, entryId: string) {
  const list = await db.packingLists.get(listId)
  if (!list) return
  await db.packingLists.update(listId, {
    entries: list.entries.filter((e) => e.id !== entryId),
  })
}

export async function togglePackingEntry(listId: string, entryId: string) {
  const list = await db.packingLists.get(listId)
  if (!list) return
  await db.packingLists.update(listId, {
    entries: list.entries.map((e) => (e.id === entryId ? { ...e, packed: !e.packed } : e)),
  })
}
