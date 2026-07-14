import { useBlobUrl } from '../hooks/useBlobUrl'
import type { Item } from '../types'

function Band({ item }: { item?: Item }) {
  const url = useBlobUrl(item?.thumbnail)
  return <div className="outfit-card-preview-band">{url && <img src={url} alt="" />}</div>
}

export function OutfitPreview({
  dress,
  shirt,
  skirt,
}: {
  dress?: Item
  shirt?: Item
  skirt?: Item
}) {
  if (dress) {
    return (
      <div className="outfit-card-preview dress">
        <Band item={dress} />
      </div>
    )
  }
  return (
    <div className="outfit-card-preview">
      <Band item={shirt} />
      <Band item={skirt} />
    </div>
  )
}
