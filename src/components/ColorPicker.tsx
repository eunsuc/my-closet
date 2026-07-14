import { useEffect } from 'react'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { extractDominantColor, sampleColorAt } from '../lib/color'

export function ColorPicker({
  image,
  color,
  onChange,
}: {
  image: Blob
  color: string | null
  onChange: (hex: string) => void
}) {
  const url = useBlobUrl(image)

  useEffect(() => {
    if (color) return
    extractDominantColor(image).then(onChange)
  }, [image, color, onChange])

  function handleTap(e: React.MouseEvent<HTMLImageElement>) {
    const img = e.currentTarget
    const rect = img.getBoundingClientRect()
    const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight)
    const renderedW = img.naturalWidth * scale
    const renderedH = img.naturalHeight * scale
    const offsetX = (rect.width - renderedW) / 2
    const offsetY = (rect.height - renderedH) / 2
    const xInImage = e.clientX - rect.left - offsetX
    const yInImage = e.clientY - rect.top - offsetY
    if (xInImage < 0 || xInImage > renderedW || yInImage < 0 || yInImage > renderedH) return
    sampleColorAt(image, xInImage / renderedW, yInImage / renderedH).then(onChange)
  }

  return (
    <div className="color-picker">
      <div className="color-swatch-row">
        <div className="color-swatch" style={{ background: color ?? 'transparent' }} />
        <div className="color-hex">{color ?? 'Detecting…'}</div>
      </div>
      <div className="color-picker-preview">
        {url && <img src={url} alt="" draggable={false} onClick={handleTap} />}
      </div>
      <div className="color-picker-hint">Tap the photo to pick an exact color</div>
    </div>
  )
}
