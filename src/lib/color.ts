function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export async function sampleColorAt(image: Blob, xFrac: number, yFrac: number): Promise<string> {
  const bitmap = await createImageBitmap(image)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    bitmap.close()
    return '#cccccc'
  }
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const x = Math.min(canvas.width - 1, Math.max(0, Math.round(xFrac * canvas.width)))
  const y = Math.min(canvas.height - 1, Math.max(0, Math.round(yFrac * canvas.height)))
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
  return rgbToHex(r, g, b)
}

export function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (delta === 0) return -1 // achromatic (gray/white/black) — sorts before all hues
  let hue: number
  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4
  hue *= 60
  return hue < 0 ? hue + 360 : hue
}
