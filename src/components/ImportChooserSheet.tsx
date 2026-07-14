import { useState } from 'react'

export function ImportChooserSheet({
  onChooseFile,
  onPasted,
  onClose,
}: {
  onChooseFile: () => void
  onPasted: (blob: Blob) => void
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  async function handlePaste() {
    setError(null)
    if (!navigator.clipboard?.read) {
      setError(
        'Clipboard paste isn’t available here. Use Share → Save Image after lifting the subject, then "Choose from Photos".',
      )
      return
    }
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          onPasted(blob)
          return
        }
      }
      setError('No image found on the clipboard. Copy the lifted subject first, then try again.')
    } catch {
      setError('Couldn’t read the clipboard. Copy the lifted subject first, then try again.')
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">Add item</div>
        <button className="btn" onClick={onChooseFile}>
          Choose from Photos
        </button>
        <button className="btn secondary" onClick={handlePaste}>
          Paste from Clipboard
        </button>
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 13, margin: '8px 0 0', textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button className="btn secondary" style={{ marginTop: 16 }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
