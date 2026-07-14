import { useBlobUrl } from '../hooks/useBlobUrl'
import type { Item } from '../types'

function Band({ item, accessory }: { item?: Item; accessory?: boolean }) {
  const url = useBlobUrl(item?.thumbnail)
  if (!item) return null
  return (
    <div className={'outfit-card-preview-band' + (accessory ? ' accessory' : '')}>
      {url && <img src={url} alt="" />}
    </div>
  )
}

export function OutfitPreview({
  hat,
  dress,
  top,
  bottom,
  shoes,
  bag,
}: {
  hat?: Item
  dress?: Item
  top?: Item
  bottom?: Item
  shoes?: Item
  bag?: Item
}) {
  return (
    <div className="outfit-card-preview">
      <Band item={hat} accessory />
      {dress ? <Band item={dress} /> : <Band item={top} />}
      {!dress && <Band item={bottom} />}
      <Band item={shoes} accessory />
      <Band item={bag} accessory />
    </div>
  )
}
