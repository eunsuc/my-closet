import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWardrobe } from '../lib/repo'

export function NewWardrobeSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  async function handleCreate() {
    if (saving) return
    setSaving(true)
    const wardrobe = await createWardrobe(name)
    setSaving(false)
    onClose()
    navigate(`/wardrobes/${wardrobe.id}`)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">New wardrobe</div>
        <input
          className="text-input"
          placeholder='Name (e.g. "To Sell", "Brisbane")'
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <button className="btn" disabled={saving} onClick={handleCreate}>
          {saving ? 'Creating…' : 'Create'}
        </button>
        <button className="btn secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
