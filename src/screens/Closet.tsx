import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { ImportSheet } from '../components/ImportSheet'
import { ItemDetailSheet } from '../components/ItemDetailSheet'
import { HangerIcon } from '../components/icons'
import { hexToHue } from '../lib/color'
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

type SortMode = 'newest' | 'color'

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
  const [sort, setSort] = useState<SortMode>('newest')
  const [pendingImage, setPendingImage] = useState<Blob | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const items = useLiveQuery(async () => {
    const all = await db.items.orderBy('createdAt').reverse().toArray()
    const filtered = filter === 'all' ? all : all.filter((i) => i.category === filter)
    if (sort === 'color') {
      return [...filtered].sort((a, b) => {
        const hueA = a.color ? hexToHue(a.color) : -2
        const hueB = b.color ? hexToHue(b.color) : -2
        return hueA - hueB
      })
    }
    return filtered
  }, [filter, sort])

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
        <div className="mode-toggle" style={{ marginTop: 10 }}>
          <button
            className={'mode-toggle-btn' + (sort === 'newest' ? ' active' : '')}
            onClick={() => setSort('newest')}
          >
            Newest
          </button>
          <button
            className={'mode-toggle-btn' + (sort === 'color' ? ' active' : '')}
            onClick={() => setSort('color')}
          >
            Color
          </button>
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
      <button className="fab" onClick={() => fileInputRef.current?.click()}>
        +
      </button>

      {pendingImage && (
        <ImportSheet image={pendingImage} onClose={() => setPendingImage(null)} />
      )}
      {selectedItem && (
        <ItemDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  )
}
