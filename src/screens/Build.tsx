import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Band } from '../components/Band'
import { saveOutfit } from '../lib/repo'
import type { Outfit } from '../types'

type Mode = 'separates' | 'dresses'

export default function Build() {
  const [mode, setMode] = useState<Mode>('separates')
  const [shirtIndex, setShirtIndex] = useState(0)
  const [skirtIndex, setSkirtIndex] = useState(0)
  const [dressIndex, setDressIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const shirts = useLiveQuery(() => db.items.where('category').equals('shirt').toArray()) ?? []
  const skirts = useLiveQuery(() => db.items.where('category').equals('skirt').toArray()) ?? []
  const dresses = useLiveQuery(() => db.items.where('category').equals('dress').toArray()) ?? []
  const outfits = useLiveQuery(() => db.outfits.toArray()) ?? []

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1600)
    return () => clearTimeout(t)
  }, [toast])

  const currentShirt = shirts.length ? shirts[shirtIndex % shirts.length] : undefined
  const currentSkirt = skirts.length ? skirts[skirtIndex % skirts.length] : undefined
  const currentDress = dresses.length ? dresses[dressIndex % dresses.length] : undefined

  const candidate: Pick<Outfit, 'dressId' | 'shirtId' | 'skirtId'> =
    mode === 'dresses'
      ? { dressId: currentDress?.id }
      : { shirtId: currentShirt?.id, skirtId: currentSkirt?.id }

  const isComplete =
    mode === 'dresses' ? !!candidate.dressId : !!candidate.shirtId && !!candidate.skirtId

  const isDuplicate =
    isComplete &&
    outfits.some(
      (o) =>
        o.dressId === candidate.dressId &&
        o.shirtId === candidate.shirtId &&
        o.skirtId === candidate.skirtId,
    )

  async function handleSave() {
    if (!isComplete || isDuplicate) return
    await saveOutfit(candidate)
    setToast('Saved!')
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-title">Build</div>
        <div className="mode-toggle">
          <button
            className={'mode-toggle-btn' + (mode === 'separates' ? ' active' : '')}
            onClick={() => setMode('separates')}
          >
            Separates
          </button>
          <button
            className={'mode-toggle-btn' + (mode === 'dresses' ? ' active' : '')}
            onClick={() => setMode('dresses')}
          >
            Dresses
          </button>
        </div>
      </div>

      <div className="build-stage">
        {mode === 'separates' ? (
          <>
            <Band
              items={shirts}
              index={shirtIndex}
              onIndexChange={setShirtIndex}
              emptyLabel="No shirts yet — add some in Closet"
            />
            <Band
              items={skirts}
              index={skirtIndex}
              onIndexChange={setSkirtIndex}
              emptyLabel="No skirts yet — add some in Closet"
            />
          </>
        ) : (
          <Band
            items={dresses}
            index={dressIndex}
            onIndexChange={setDressIndex}
            emptyLabel="No dresses yet — add some in Closet"
          />
        )}
      </div>

      <button className="save-fab" disabled={!isComplete || isDuplicate} onClick={handleSave}>
        {isDuplicate ? 'Already saved' : 'Save'}
      </button>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
