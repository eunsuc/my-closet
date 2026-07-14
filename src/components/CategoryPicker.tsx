import type { Category } from '../types'

const OPTIONS: { value: Category; label: string }[] = [
  { value: 'hat', label: 'Hat' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'dress', label: 'Dress' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'bag', label: 'Bag' },
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
