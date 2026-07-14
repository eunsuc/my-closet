import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPackingList } from '../lib/repo'

export function NewPackingListSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  async function handleCreate() {
    if (saving) return
    setSaving(true)
    const list = await createPackingList(name)
    setSaving(false)
    onClose()
    navigate(`/packing/${list.id}`)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">New packing list</div>
        <input
          className="text-input"
          placeholder="Trip name (e.g. Tokyo)"
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
