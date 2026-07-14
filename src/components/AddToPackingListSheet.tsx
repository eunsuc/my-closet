import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { OutfitPreview } from './OutfitPreview'
import { addPackingEntry } from '../lib/repo'
import type { Item, Outfit } from '../types'

function OutfitPickRow({
  outfit,
  items,
  onAdd,
}: {
  outfit: Outfit
  items: Map<string, Item>
  onAdd: () => void
}) {
  return (
    <button className="pick-row" onClick={onAdd}>
      <div className="pick-row-preview">
        <OutfitPreview
          hat={outfit.hatId ? items.get(outfit.hatId) : undefined}
          dress={outfit.dressId ? items.get(outfit.dressId) : undefined}
          top={outfit.topId ? items.get(outfit.topId) : undefined}
          bottom={outfit.bottomId ? items.get(outfit.bottomId) : undefined}
          shoes={outfit.shoesId ? items.get(outfit.shoesId) : undefined}
          bag={outfit.bagId ? items.get(outfit.bagId) : undefined}
        />
      </div>
      <div className="pick-row-name">{outfit.name || 'Outfit'}</div>
    </button>
  )
}

function ItemPickRow({ item, onAdd }: { item: Item; onAdd: () => void }) {
  const url = useBlobUrl(item.thumbnail)
  return (
    <button className="pick-row" onClick={onAdd}>
      <div className="pick-row-preview">{url && <img src={url} alt="" />}</div>
      <div className="pick-row-name">{item.name || item.category}</div>
    </button>
  )
}

export function AddToPackingListSheet({
  listId,
  onClose,
}: {
  listId: string
  onClose: () => void
}) {
  const [tab, setTab] = useState<'outfits' | 'items'>('outfits')

  const outfits = useLiveQuery(() => db.outfits.orderBy('createdAt').reverse().toArray()) ?? []
  const items = useLiveQuery(() => db.items.orderBy('createdAt').reverse().toArray()) ?? []
  const itemsMap = useLiveQuery(async () => {
    const all = await db.items.toArray()
    return new Map(all.map((i) => [i.id, i]))
  })

  async function handleAddOutfit(id: string) {
    await addPackingEntry(listId, 'outfit', id)
  }

  async function handleAddItem(id: string) {
    await addPackingEntry(listId, 'item', id)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">Add to list</div>
        <div className="mode-toggle" style={{ marginBottom: 16 }}>
          <button
            className={'mode-toggle-btn' + (tab === 'outfits' ? ' active' : '')}
            onClick={() => setTab('outfits')}
          >
            Outfits
          </button>
          <button
            className={'mode-toggle-btn' + (tab === 'items' ? ' active' : '')}
            onClick={() => setTab('items')}
          >
            Items
          </button>
        </div>

        <div className="pick-grid">
          {tab === 'outfits' &&
            itemsMap &&
            (outfits.length === 0 ? (
              <div className="empty-state" style={{ padding: 16 }}>
                No saved outfits yet.
              </div>
            ) : (
              outfits.map((outfit) => (
                <OutfitPickRow
                  key={outfit.id}
                  outfit={outfit}
                  items={itemsMap}
                  onAdd={() => handleAddOutfit(outfit.id)}
                />
              ))
            ))}

          {tab === 'items' &&
            (items.length === 0 ? (
              <div className="empty-state" style={{ padding: 16 }}>
                No items yet.
              </div>
            ) : (
              items.map((item) => (
                <ItemPickRow key={item.id} item={item} onAdd={() => handleAddItem(item.id)} />
              ))
            ))}
        </div>

        <button className="btn secondary" style={{ marginTop: 16 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
