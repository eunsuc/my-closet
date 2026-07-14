import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { OutfitPreview } from '../components/OutfitPreview'
import { OutfitDetailSheet } from '../components/OutfitDetailSheet'
import type { Outfit } from '../types'

export default function Outfits() {
  const [selected, setSelected] = useState<Outfit | null>(null)

  const outfits = useLiveQuery(() => db.outfits.orderBy('createdAt').reverse().toArray())
  const items = useLiveQuery(async () => {
    const all = await db.items.toArray()
    return new Map(all.map((i) => [i.id, i]))
  })

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-title">Outfits</div>
      </div>

      {outfits && outfits.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 40 }}>📸</div>
          <div>No saved outfits yet. Build one in the Build tab.</div>
        </div>
      )}

      {items && (
        <div className="outfit-grid">
          {outfits?.map((outfit) => (
            <button
              key={outfit.id}
              className="outfit-card"
              onClick={() => setSelected(outfit)}
            >
              <OutfitPreview
                dress={outfit.dressId ? items.get(outfit.dressId) : undefined}
                shirt={outfit.shirtId ? items.get(outfit.shirtId) : undefined}
                skirt={outfit.skirtId ? items.get(outfit.skirtId) : undefined}
              />
              {outfit.name && <div className="outfit-card-name">{outfit.name}</div>}
            </button>
          ))}
        </div>
      )}

      {selected && items && (
        <OutfitDetailSheet outfit={selected} items={items} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
