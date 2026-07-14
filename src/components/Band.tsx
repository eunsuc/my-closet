import { useRef, useState } from 'react'
import { useBlobUrl } from '../hooks/useBlobUrl'
import type { Item } from '../types'

const SWIPE_THRESHOLD = 60

function BandImage({ item }: { item: Item }) {
  const url = useBlobUrl(item.image)
  return (
    <div className="band-image-wrap">
      {url && <img src={url} alt={item.name ?? item.category} />}
    </div>
  )
}

export function Band({
  items,
  index,
  onIndexChange,
  emptyLabel,
}: {
  items: Item[]
  index: number
  onIndexChange: (next: number) => void
  emptyLabel: string
}) {
  const [dragX, setDragX] = useState(0)
  const dragging = useRef(false)
  const startX = useRef(0)

  if (items.length === 0) {
    return (
      <div className="band">
        <div className="band-empty">{emptyLabel}</div>
      </div>
    )
  }

  const current = items[index % items.length]

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true
    startX.current = e.clientX
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    setDragX(e.clientX - startX.current)
  }

  function handlePointerUp() {
    if (!dragging.current) return
    dragging.current = false
    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      const direction = dragX < 0 ? 1 : -1
      const next = (index + direction + items.length) % items.length
      onIndexChange(next)
    }
    setDragX(0)
  }

  return (
    <div
      className="band"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        style={{
          transform: `translateX(${dragX}px)`,
          opacity: 1 - Math.min(Math.abs(dragX) / 300, 0.6),
          transition: dragging.current ? 'none' : 'transform 0.2s ease, opacity 0.2s ease',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BandImage item={current} />
      </div>
      {items.length > 1 && (
        <div className="band-indicator">
          {(index % items.length) + 1} / {items.length}
        </div>
      )}
    </div>
  )
}
