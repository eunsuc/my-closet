import { useState } from 'react'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { CategoryPicker } from './CategoryPicker'
import { updateItem, deleteItem } from '../lib/repo'
import type { Item } from '../types'

export function ItemDetailSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const [category, setCategory] = useState(item.category)
  const [name, setName] = useState(item.name ?? '')
  const [purchasedFrom, setPurchasedFrom] = useState(item.purchasedFrom ?? '')
  const imageUrl = useBlobUrl(item.image)

  async function handleCategoryChange(next: typeof category) {
    setCategory(next)
    await updateItem(item.id, { category: next })
  }

  async function handleNameBlur() {
    await updateItem(item.id, { name })
  }

  async function handlePurchasedFromBlur() {
    await updateItem(item.id, { purchasedFrom })
  }

  async function handleDelete() {
    await deleteItem(item.id)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">{item.name || 'Item'}</div>
        <div className="sheet-preview">{imageUrl && <img src={imageUrl} alt="" />}</div>
        <CategoryPicker value={category} onChange={handleCategoryChange} />
        <input
          className="text-input"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
        />
        <input
          className="text-input"
          placeholder="Bought at (optional)"
          value={purchasedFrom}
          onChange={(e) => setPurchasedFrom(e.target.value)}
          onBlur={handlePurchasedFromBlur}
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
