import { useRef, useState } from 'react'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { CategoryPicker } from './CategoryPicker'
import { ColorPicker } from './ColorPicker'
import { ImageCropper, type ImageCropperHandle } from './ImageCropper'
import { updateItem, deleteItem, recropItem } from '../lib/repo'
import type { Item } from '../types'

export function ItemDetailSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const [category, setCategory] = useState(item.category)
  const [name, setName] = useState(item.name ?? '')
  const [purchasedFrom, setPurchasedFrom] = useState(item.purchasedFrom ?? '')
  const [price, setPrice] = useState(item.price !== undefined ? String(item.price) : '')
  const [color, setColor] = useState<string | null>(item.color ?? null)
  const [currentImage, setCurrentImage] = useState(item.image)
  const [recropping, setRecropping] = useState(false)
  const [savingCrop, setSavingCrop] = useState(false)
  const cropperRef = useRef<ImageCropperHandle>(null)
  const imageUrl = useBlobUrl(currentImage)

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

  async function handlePriceBlur() {
    await updateItem(item.id, { price: price ? Number(price) : undefined })
  }

  async function handleColorChange(hex: string) {
    setColor(hex)
    await updateItem(item.id, { color: hex })
  }

  async function handleDelete() {
    await deleteItem(item.id)
    onClose()
  }

  async function handleApplyCrop() {
    if (savingCrop) return
    setSavingCrop(true)
    const cropped = await cropperRef.current?.getCroppedBlob()
    if (cropped) {
      await recropItem(item.id, cropped)
      setCurrentImage(cropped)
    }
    setSavingCrop(false)
    setRecropping(false)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">{item.name || 'Item'}</div>

        {recropping ? (
          <>
            <ImageCropper ref={cropperRef} image={currentImage} />
            <button className="btn" disabled={savingCrop} onClick={handleApplyCrop}>
              {savingCrop ? 'Saving…' : 'Apply crop'}
            </button>
            <button className="btn secondary" onClick={() => setRecropping(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="sheet-preview">{imageUrl && <img src={imageUrl} alt="" />}</div>
            <button className="btn secondary" onClick={() => setRecropping(true)}>
              Recrop photo
            </button>
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
            <input
              className="text-input"
              placeholder="Price paid (optional)"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
              onBlur={handlePriceBlur}
            />
            <ColorPicker image={currentImage} color={color} onChange={handleColorChange} />
            <button className="btn danger" onClick={handleDelete}>
              Delete
            </button>
            <button className="btn secondary" onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}
