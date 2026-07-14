import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { ImportSheet } from '../components/ImportSheet'
import { ImportChooserSheet } from '../components/ImportChooserSheet'
import { ItemDetailSheet } from '../components/ItemDetailSheet'
import { HangerIcon } from '../components/icons'
import type { Category, Item } from '../types'

const FILTERS: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'hat', label: 'Hats' },
  { value: 'top', label: 'Tops' },
  { value: 'bottom', label: 'Bottoms' },
  { value: 'dress', label: 'Dresses' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'bag', label: 'Bags' },
]

function ItemThumb({ item, onClick }: { item: Item; onClick: () => void }) {
  const url = useBlobUrl(item.thumbnail)
  return (
    <button className="item-grid-cell" onClick={onClick}>
      {url && <img src={url} alt={item.name ?? item.category} />}
    </button>
  )
}

export default function Closet() {
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [showChooser, setShowChooser] = useState(false)
  const [pendingImage, setPendingImage] = useState<Blob | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const items = useLiveQuery(async () => {
    const all = await db.items.orderBy('createdAt').reverse().toArray()
    return filter === 'all' ? all : all.filter((i) => i.category === filter)
  }, [filter])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingImage(file)
    e.target.value = ''
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-title">Closet</div>
        <div className="chip-row">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={'chip' + (filter === f.value ? ' active' : '')}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {items && items.length === 0 && (
        <div className="empty-state">
          <HangerIcon size={40} />
          <div>No items yet. Tap + to import a photo.</div>
        </div>
      )}

      <div className="item-grid">
        {items?.map((item) => (
          <ItemThumb key={item.id} item={item} onClick={() => setSelectedItem(item)} />
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button className="fab" onClick={() => setShowChooser(true)}>
        +
      </button>

      {showChooser && (
        <ImportChooserSheet
          onChooseFile={() => {
            setShowChooser(false)
            fileInputRef.current?.click()
          }}
          onPasted={(blob) => {
            setShowChooser(false)
            setPendingImage(blob)
          }}
          onClose={() => setShowChooser(false)}
        />
      )}
      {pendingImage && (
        <ImportSheet image={pendingImage} onClose={() => setPendingImage(null)} />
      )}
      {selectedItem && (
        <ItemDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  )
}
