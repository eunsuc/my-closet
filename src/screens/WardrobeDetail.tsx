import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { OutfitPreview } from '../components/OutfitPreview'
import { AddToWardrobeSheet } from '../components/AddToWardrobeSheet'
import { SuitcaseIcon } from '../components/icons'
import {
  deleteWardrobe,
  removeWardrobeEntry,
  renameWardrobe,
  setWardrobePackingMode,
  toggleWardrobeEntry,
} from '../lib/repo'
import type { Item, Outfit, WardrobeEntry } from '../types'

function EntryRow({
  entry,
  preview,
  name,
  packingMode,
  onToggle,
  onRemove,
}: {
  entry: WardrobeEntry
  preview: React.ReactNode
  name: string
  packingMode: boolean
  onToggle: () => void
  onRemove: () => void
}) {
  return (
    <div className={'packing-entry' + (packingMode && entry.packed ? ' packed' : '')}>
      {packingMode && (
        <button className="packing-entry-check" onClick={onToggle}>
          {entry.packed ? '✓' : ''}
        </button>
      )}
      <div className="packing-entry-preview">{preview}</div>
      <div className="packing-entry-name">{name}</div>
      <button className="packing-entry-remove" onClick={onRemove}>
        ×
      </button>
    </div>
  )
}

function OutfitEntryRow({
  entry,
  outfit,
  items,
  packingMode,
  onToggle,
  onRemove,
}: {
  entry: WardrobeEntry
  outfit: Outfit
  items: Map<string, Item>
  packingMode: boolean
  onToggle: () => void
  onRemove: () => void
}) {
  return (
    <EntryRow
      entry={entry}
      packingMode={packingMode}
      name={outfit.name || 'Outfit'}
      onToggle={onToggle}
      onRemove={onRemove}
      preview={
        <OutfitPreview
          hat={outfit.hatId ? items.get(outfit.hatId) : undefined}
          dress={outfit.dressId ? items.get(outfit.dressId) : undefined}
          top={outfit.topId ? items.get(outfit.topId) : undefined}
          bottom={outfit.bottomId ? items.get(outfit.bottomId) : undefined}
          shoes={outfit.shoesId ? items.get(outfit.shoesId) : undefined}
          bag={outfit.bagId ? items.get(outfit.bagId) : undefined}
        />
      }
    />
  )
}

function ItemEntryRow({
  entry,
  item,
  packingMode,
  onToggle,
  onRemove,
}: {
  entry: WardrobeEntry
  item: Item
  packingMode: boolean
  onToggle: () => void
  onRemove: () => void
}) {
  const url = useBlobUrl(item.thumbnail)
  return (
    <EntryRow
      entry={entry}
      packingMode={packingMode}
      name={item.name || item.category}
      onToggle={onToggle}
      onRemove={onRemove}
      preview={url && <img src={url} alt="" />}
    />
  )
}

export default function WardrobeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState<string | null>(null)

  const wardrobe = useLiveQuery(() => (id ? db.wardrobes.get(id) : undefined), [id])
  const outfits = useLiveQuery(() => db.outfits.toArray()) ?? []
  const itemsMap = useLiveQuery(async () => {
    const all = await db.items.toArray()
    return new Map(all.map((i) => [i.id, i]))
  })
  const outfitsMap = new Map(outfits.map((o) => [o.id, o]))

  if (!id || wardrobe === undefined || itemsMap === undefined) {
    return <div className="screen" />
  }

  async function handleNameBlur() {
    if (name !== null) await renameWardrobe(wardrobe!.id, name)
    setName(null)
  }

  async function handleDelete() {
    await deleteWardrobe(wardrobe!.id)
    navigate('/wardrobes')
  }

  const packedCount = wardrobe.entries.filter((e) => e.packed).length

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-link" onClick={() => navigate('/wardrobes')}>
          ← Wardrobes
        </button>
        <input
          className="screen-title-input"
          value={name ?? wardrobe.name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
        />
        <div className="mode-toggle" style={{ marginBottom: 8 }}>
          <button
            className={'mode-toggle-btn' + (!wardrobe.packingMode ? ' active' : '')}
            onClick={() => setWardrobePackingMode(wardrobe.id, false)}
          >
            Wardrobe
          </button>
          <button
            className={'mode-toggle-btn' + (wardrobe.packingMode ? ' active' : '')}
            onClick={() => setWardrobePackingMode(wardrobe.id, true)}
          >
            Packing list
          </button>
        </div>
        <div className="packing-progress-label">
          {wardrobe.entries.length === 0
            ? 'Nothing added yet'
            : wardrobe.packingMode
              ? `${packedCount} / ${wardrobe.entries.length} packed`
              : `${wardrobe.entries.length} item${wardrobe.entries.length === 1 ? '' : 's'}`}
        </div>
      </div>

      {wardrobe.entries.length === 0 && (
        <div className="empty-state">
          <SuitcaseIcon size={40} />
          <div>Tap + to add items or outfits to this wardrobe.</div>
        </div>
      )}

      <div className="packing-entry-list">
        {itemsMap &&
          wardrobe.entries.map((entry) => {
            if (entry.kind === 'outfit') {
              const outfit = outfitsMap.get(entry.refId)
              if (!outfit) return null
              return (
                <OutfitEntryRow
                  key={entry.id}
                  entry={entry}
                  outfit={outfit}
                  items={itemsMap}
                  packingMode={wardrobe.packingMode}
                  onToggle={() => toggleWardrobeEntry(wardrobe.id, entry.id)}
                  onRemove={() => removeWardrobeEntry(wardrobe.id, entry.id)}
                />
              )
            }
            const item = itemsMap.get(entry.refId)
            if (!item) return null
            return (
              <ItemEntryRow
                key={entry.id}
                entry={entry}
                item={item}
                packingMode={wardrobe.packingMode}
                onToggle={() => toggleWardrobeEntry(wardrobe.id, entry.id)}
                onRemove={() => removeWardrobeEntry(wardrobe.id, entry.id)}
              />
            )
          })}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <button className="btn danger" onClick={handleDelete}>
          Delete wardrobe
        </button>
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        +
      </button>

      {showAdd && <AddToWardrobeSheet wardrobeId={wardrobe.id} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
