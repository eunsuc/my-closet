import { useRef, useState } from 'react'
import { CategoryPicker } from './CategoryPicker'
import { ColorPicker } from './ColorPicker'
import { ImageCropper, type ImageCropperHandle } from './ImageCropper'
import { addItem } from '../lib/repo'
import type { Category } from '../types'

export function ImportSheet({ image, onClose }: { image: Blob; onClose: () => void }) {
  const [category, setCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [purchasedFrom, setPurchasedFrom] = useState('')
  const [price, setPrice] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const cropperRef = useRef<ImageCropperHandle>(null)

  async function handleSave() {
    if (!category || saving) return
    setSaving(true)
    const croppedImage = (await cropperRef.current?.getCroppedBlob()) ?? image
    await addItem(
      croppedImage,
      category,
      name,
      purchasedFrom,
      price ? Number(price) : undefined,
      color ?? undefined,
    )
    setSaving(false)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">New item</div>
        <ImageCropper ref={cropperRef} image={image} onCenterColorChange={setColor} />
        <CategoryPicker value={category} onChange={setCategory} />
        <input
          className="text-input"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="text-input"
          placeholder="Bought at (optional)"
          value={purchasedFrom}
          onChange={(e) => setPurchasedFrom(e.target.value)}
        />
        <input
          className="text-input"
          placeholder="Price paid (optional)"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
        />
        <ColorPicker image={image} color={color} onChange={setColor} />
        <button className="btn" disabled={!category || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="btn secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
