import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { OutfitPreview } from '../components/OutfitPreview'
import { AddToPackingListSheet } from '../components/AddToPackingListSheet'
import {
  deletePackingList,
  removePackingEntry,
  renamePackingList,
  togglePackingEntry,
} from '../lib/repo'
import type { Item, Outfit, PackingEntry } from '../types'

function OutfitEntryRow({
  entry,
  outfit,
  items,
  onToggle,
  onRemove,
}: {
  entry: PackingEntry
  outfit: Outfit
  items: Map<string, Item>
  onToggle: () => void
  onRemove: () => void
}) {
  return (
    <div className={'packing-entry' + (entry.packed ? ' packed' : '')}>
      <button className="packing-entry-check" onClick={onToggle}>
        {entry.packed ? '✓' : ''}
      </button>
      <div className="packing-entry-preview">
        <OutfitPreview
          hat={outfit.hatId ? items.get(outfit.hatId) : undefined}
          dress={outfit.dressId ? items.get(outfit.dressId) : undefined}
          top={outfit.topId ? items.get(outfit.topId) : undefined}
          bottom={outfit.bottomId ? items.get(outfit.bottomId) : undefined}
          shoes={outfit.shoesId ? items.get(outfit.shoesId) : undefined}
          bag={outfit.bagId ? items.get(outfit.bagId) : undefined}
        />
      </div>
      <div className="packing-entry-name">{outfit.name || 'Outfit'}</div>
      <button className="packing-entry-remove" onClick={onRemove}>
        ×
      </button>
    </div>
  )
}

function ItemEntryRow({
  entry,
  item,
  onToggle,
  onRemove,
}: {
  entry: PackingEntry
  item: Item
  onToggle: () => void
  onRemove: () => void
}) {
  const url = useBlobUrl(item.thumbnail)
  return (
    <div className={'packing-entry' + (entry.packed ? ' packed' : '')}>
      <button className="packing-entry-check" onClick={onToggle}>
        {entry.packed ? '✓' : ''}
      </button>
      <div className="packing-entry-preview">{url && <img src={url} alt="" />}</div>
      <div className="packing-entry-name">{item.name || item.category}</div>
      <button className="packing-entry-remove" onClick={onRemove}>
        ×
      </button>
    </div>
  )
}

export default function PackingListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState<string | null>(null)

  const list = useLiveQuery(() => (id ? db.packingLists.get(id) : undefined), [id])
  const outfits = useLiveQuery(() => db.outfits.toArray()) ?? []
  const itemsMap = useLiveQuery(async () => {
    const all = await db.items.toArray()
    return new Map(all.map((i) => [i.id, i]))
  })
  const outfitsMap = new Map(outfits.map((o) => [o.id, o]))

  if (!id || list === undefined || itemsMap === undefined) {
    return <div className="screen" />
  }

  async function handleNameBlur() {
    if (name !== null) await renamePackingList(list!.id, name)
    setName(null)
  }

  async function handleDeleteList() {
    await deletePackingList(list!.id)
    navigate('/packing')
  }

  const packedCount = list.entries.filter((e) => e.packed).length

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-link" onClick={() => navigate('/packing')}>
          ← Packing
        </button>
        <input
          className="screen-title-input"
          value={name ?? list.name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
        />
        <div className="packing-progress-label">
          {list.entries.length === 0
            ? 'Nothing added yet'
            : `${packedCount} / ${list.entries.length} packed`}
        </div>
      </div>

      {list.entries.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 40 }}>🧳</div>
          <div>Tap + to add outfits or items to pack.</div>
        </div>
      )}

      <div className="packing-entry-list">
        {itemsMap &&
          list.entries.map((entry) => {
            if (entry.kind === 'outfit') {
              const outfit = outfitsMap.get(entry.refId)
              if (!outfit) return null
              return (
                <OutfitEntryRow
                  key={entry.id}
                  entry={entry}
                  outfit={outfit}
                  items={itemsMap}
                  onToggle={() => togglePackingEntry(list.id, entry.id)}
                  onRemove={() => removePackingEntry(list.id, entry.id)}
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
                onToggle={() => togglePackingEntry(list.id, entry.id)}
                onRemove={() => removePackingEntry(list.id, entry.id)}
              />
            )
          })}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <button className="btn danger" onClick={handleDeleteList}>
          Delete list
        </button>
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        +
      </button>

      {showAdd && <AddToPackingListSheet listId={list.id} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
