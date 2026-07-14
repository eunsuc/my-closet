import { useState } from 'react'
import { OutfitPreview } from './OutfitPreview'
import { deleteOutfit } from '../lib/repo'
import { db } from '../db'
import type { Item, Outfit } from '../types'

export function OutfitDetailSheet({
  outfit,
  items,
  onClose,
}: {
  outfit: Outfit
  items: Map<string, Item>
  onClose: () => void
}) {
  const [name, setName] = useState(outfit.name ?? '')

  async function handleNameBlur() {
    await db.outfits.update(outfit.id, { name: name.trim() || undefined })
  }

  async function handleDelete() {
    await deleteOutfit(outfit.id)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">{outfit.name || 'Outfit'}</div>
        <div className="sheet-preview" style={{ aspectRatio: '3/4' }}>
          <OutfitPreview
            dress={outfit.dressId ? items.get(outfit.dressId) : undefined}
            shirt={outfit.shirtId ? items.get(outfit.shirtId) : undefined}
            skirt={outfit.skirtId ? items.get(outfit.skirtId) : undefined}
          />
        </div>
        <input
          className="text-input"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
        />
        <button className="btn danger" onClick={handleDelete}>
          Delete
        </button>
        <button className="btn secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
