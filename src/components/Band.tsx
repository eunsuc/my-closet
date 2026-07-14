import { useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useBlobUrl } from '../hooks/useBlobUrl'
import type { Item } from '../types'

const EMBLA_OPTIONS = { loop: true, align: 'center' as const }

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
  onIndexChange,
  emptyLabel,
  noneLabel,
  accessory,
  matchWidth,
}: {
  items: (Item | null)[]
  onIndexChange: (next: number) => void
  emptyLabel: string
  noneLabel?: string
  accessory?: boolean
  matchWidth?: boolean
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => onIndexChange(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onIndexChange])

  // items.length changes (item added/deleted while this screen is open) need a reInit
  // so Embla recomputes slide positions instead of using stale measurements.
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit()
    onIndexChange(emblaApi.selectedScrollSnap())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, items.length])

  const className =
    'band' + (accessory ? ' accessory' : '') + (matchWidth ? ' match-width' : '')

  if (items.length === 0) {
    return (
      <div className={className}>
        <div className="band-empty">{emptyLabel}</div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="band-viewport" ref={emblaRef}>
        <div className="band-track">
          {items.map((item, i) => (
            <div className="band-slide" key={item?.id ?? `none-${i}`}>
              {item ? <BandImage item={item} /> : <div className="band-none">{noneLabel}</div>}
            </div>
          ))}
        </div>
      </div>
      {items.length > 1 && (
        <div className="band-indicator">
          {(emblaApi?.selectedScrollSnap() ?? 0) + 1} / {items.length}
        </div>
      )}
    </div>
  )
}
