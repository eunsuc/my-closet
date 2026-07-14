import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useBlobUrl } from '../hooks/useBlobUrl'

interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

const ZERO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 }
const MAX_INSET = 0.9

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export interface ImageCropperHandle {
  getCroppedBlob: () => Promise<Blob>
}

export const ImageCropper = forwardRef<ImageCropperHandle, { image: Blob }>(function ImageCropper(
  { image },
  ref,
) {
  const url = useBlobUrl(image)
  const containerRef = useRef<HTMLDivElement>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null)
  const [insets, setInsets] = useState<Insets>(ZERO_INSETS)
  const dragEdge = useRef<keyof Insets | null>(null)

  function measure() {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) setContainerSize({ w: rect.width, h: rect.height })
  }

  const renderedRect = useMemo(() => {
    if (!containerSize || !naturalSize) return null
    const scale = Math.min(containerSize.w / naturalSize.w, containerSize.h / naturalSize.h)
    const renderedW = naturalSize.w * scale
    const renderedH = naturalSize.h * scale
    return {
      offsetX: (containerSize.w - renderedW) / 2,
      offsetY: (containerSize.h - renderedH) / 2,
      renderedW,
      renderedH,
    }
  }, [containerSize, naturalSize])

  useImperativeHandle(
    ref,
    () => ({
      async getCroppedBlob() {
        if (!naturalSize) return image
        const { w, h } = naturalSize
        const sx = Math.round(insets.left * w)
        const sy = Math.round(insets.top * h)
        const sw = Math.round(w - (insets.left + insets.right) * w)
        const sh = Math.round(h - (insets.top + insets.bottom) * h)
        if (sx === 0 && sy === 0 && sw === w && sh === h) return image

        const bitmap = await createImageBitmap(image)
        const canvas = document.createElement('canvas')
        canvas.width = sw
        canvas.height = sh
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get canvas context')
        ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)
        bitmap.close()

        return new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
            'image/png',
          )
        })
      },
    }),
    [image, insets, naturalSize],
  )

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
    measure()
  }

  function startDrag(edge: keyof Insets) {
    return (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      dragEdge.current = edge
      ;(e.target as Element).setPointerCapture(e.pointerId)
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const edge = dragEdge.current
    if (!edge || !renderedRect) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    if (edge === 'left' || edge === 'right') {
      const xInImage = e.clientX - rect.left - renderedRect.offsetX
      const fraction = clamp(xInImage / renderedRect.renderedW, 0, 1)
      setInsets((prev) =>
        edge === 'left'
          ? { ...prev, left: clamp(fraction, 0, MAX_INSET - prev.right) }
          : { ...prev, right: clamp(1 - fraction, 0, MAX_INSET - prev.left) },
      )
    } else {
      const yInImage = e.clientY - rect.top - renderedRect.offsetY
      const fraction = clamp(yInImage / renderedRect.renderedH, 0, 1)
      setInsets((prev) =>
        edge === 'top'
          ? { ...prev, top: clamp(fraction, 0, MAX_INSET - prev.bottom) }
          : { ...prev, bottom: clamp(1 - fraction, 0, MAX_INSET - prev.top) },
      )
    }
  }

  function handlePointerUp() {
    dragEdge.current = null
  }

  function resetCrop() {
    setInsets(ZERO_INSETS)
  }

  const hasCrop =
    insets.top > 0 || insets.right > 0 || insets.bottom > 0 || insets.left > 0

  return (
    <div className="cropper">
      <div
        ref={containerRef}
        className="cropper-frame"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {url && (
          <img
            src={url}
            alt=""
            className="cropper-image"
            draggable={false}
            onLoad={handleImgLoad}
          />
        )}
        {renderedRect && (
          <>
            {(['top', 'bottom', 'left', 'right'] as const).map((edge) => (
              <div
                key={edge}
                className="cropper-mask"
                style={maskStyle(edge, insets, renderedRect)}
              />
            ))}
            <div className="cropper-rect" style={rectStyle(insets, renderedRect)}>
              <div className="cropper-handle top" onPointerDown={startDrag('top')} />
              <div className="cropper-handle bottom" onPointerDown={startDrag('bottom')} />
              <div className="cropper-handle left" onPointerDown={startDrag('left')} />
              <div className="cropper-handle right" onPointerDown={startDrag('right')} />
            </div>
          </>
        )}
      </div>
      {hasCrop && (
        <button type="button" className="cropper-reset" onClick={resetCrop}>
          Reset crop
        </button>
      )}
    </div>
  )
})

function rectStyle(
  insets: Insets,
  rr: { offsetX: number; offsetY: number; renderedW: number; renderedH: number },
): React.CSSProperties {
  return {
    left: rr.offsetX + insets.left * rr.renderedW,
    top: rr.offsetY + insets.top * rr.renderedH,
    width: rr.renderedW * (1 - insets.left - insets.right),
    height: rr.renderedH * (1 - insets.top - insets.bottom),
  }
}

function maskStyle(
  edge: 'top' | 'bottom' | 'left' | 'right',
  insets: Insets,
  rr: { offsetX: number; offsetY: number; renderedW: number; renderedH: number },
): React.CSSProperties {
  const left = rr.offsetX
  const top = rr.offsetY
  const w = rr.renderedW
  const h = rr.renderedH
  switch (edge) {
    case 'top':
      return { left, top, width: w, height: insets.top * h }
    case 'bottom':
      return { left, top: top + h - insets.bottom * h, width: w, height: insets.bottom * h }
    case 'left':
      return {
        left,
        top: top + insets.top * h,
        width: insets.left * w,
        height: h * (1 - insets.top - insets.bottom),
      }
    case 'right':
      return {
        left: left + w - insets.right * w,
        top: top + insets.top * h,
        width: insets.right * w,
        height: h * (1 - insets.top - insets.bottom),
      }
  }
}
