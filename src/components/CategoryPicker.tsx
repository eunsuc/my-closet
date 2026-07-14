import type { Category } from '../types'

const OPTIONS: { value: Category; label: string }[] = [
  { value: 'dress', label: 'Dress' },
  { value: 'shirt', label: 'Shirt' },
  { value: 'skirt', label: 'Skirt' },
]

export function CategoryPicker({
  value,
  onChange,
}: {
  value: Category | null
  onChange: (category: Category) => void
}) {
  return (
    <div className="category-row">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={'category-btn' + (value === opt.value ? ' active' : '')}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
