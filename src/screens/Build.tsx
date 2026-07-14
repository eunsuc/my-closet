import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Band } from '../components/Band'
import { saveOutfit } from '../lib/repo'
import type { Item } from '../types'

type Mode = 'separates' | 'dress'

const MAX_PAIRED_WIDTH = 0.6
const MIN_PAIRED_WIDTH = 0.15

function withNone(items: Item[]): (Item | null)[] {
  return items.length ? [null, ...items] : []
}

function useImageAspect(item: Item | undefined): number | null {
  const [aspect, setAspect] = useState<number | null>(null)
  useEffect(() => {
    if (!item) {
      setAspect(null)
      return
    }
    let cancelled = false
    createImageBitmap(item.image).then((bitmap) => {
      if (!cancelled) setAspect(bitmap.width / bitmap.height)
      bitmap.close()
    })
    return () => {
      cancelled = true
    }
  }, [item])
  return aspect
}

export default function Build() {
  const [mode, setMode] = useState<Mode>('separates')
  const [hatIndex, setHatIndex] = useState(0)
  const [topIndex, setTopIndex] = useState(0)
  const [bottomIndex, setBottomIndex] = useState(0)
  const [dressIndex, setDressIndex] = useState(0)
  const [shoesIndex, setShoesIndex] = useState(0)
  const [bagIndex, setBagIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [pairedBandSize, setPairedBandSize] = useState<{ w: number; h: number } | null>(null)
  const topBandRef = useRef<HTMLDivElement>(null)

  const hats = useLiveQuery(() => db.items.where('category').equals('hat').toArray()) ?? []
  const tops = useLiveQuery(() => db.items.where('category').equals('top').toArray()) ?? []
  const bottoms = useLiveQuery(() => db.items.where('category').equals('bottom').toArray()) ?? []
  const dresses = useLiveQuery(() => db.items.where('category').equals('dress').toArray()) ?? []
  const shoes = useLiveQuery(() => db.items.where('category').equals('shoes').toArray()) ?? []
  const bags = useLiveQuery(() => db.items.where('category').equals('bag').toArray()) ?? []
  const outfits = useLiveQuery(() => db.outfits.toArray()) ?? []

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1600)
    return () => clearTimeout(t)
  }, [toast])

  const hatsWithNone = withNone(hats)
  const shoesWithNone = withNone(shoes)
  const bagsWithNone = withNone(bags)

  const currentHat = hatsWithNone.length ? hatsWithNone[hatIndex % hatsWithNone.length] : undefined
  const currentTop = tops.length ? tops[topIndex % tops.length] : undefined
  const currentBottom = bottoms.length ? bottoms[bottomIndex % bottoms.length] : undefined
  const currentDress = dresses.length ? dresses[dressIndex % dresses.length] : undefined
  const currentShoes = shoesWithNone.length
    ? shoesWithNone[shoesIndex % shoesWithNone.length]
    : undefined
  const currentBag = bagsWithNone.length ? bagsWithNone[bagIndex % bagsWithNone.length] : undefined

  const topAspect = useImageAspect(currentTop)
  const bottomAspect = useImageAspect(currentBottom)

  // Top and Bottom share a fixed width so they align like a paper doll, but that
  // width must never make either image taller than the band actually is — so it's
  // computed from the real band height and each image's real aspect ratio, capped
  // at MAX_PAIRED_WIDTH and floored at MIN_PAIRED_WIDTH so it's never illegibly tiny.
  useEffect(() => {
    function measure() {
      const el = topBandRef.current
      if (el) setPairedBandSize({ w: el.clientWidth, h: el.clientHeight })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [mode])

  const pairedWidth = useMemo(() => {
    if (!pairedBandSize) return MAX_PAIRED_WIDTH
    const safeFractions: number[] = []
    for (const aspect of [topAspect, bottomAspect]) {
      if (!aspect) continue
      const widthForFullHeight = (pairedBandSize.h * aspect) / pairedBandSize.w
      safeFractions.push(widthForFullHeight)
    }
    if (safeFractions.length === 0) return MAX_PAIRED_WIDTH
    return Math.min(MAX_PAIRED_WIDTH, Math.max(MIN_PAIRED_WIDTH, Math.min(...safeFractions)))
  }, [pairedBandSize, topAspect, bottomAspect])

  const candidate = {
    hatId: currentHat?.id,
    topId: mode === 'separates' ? currentTop?.id : undefined,
    bottomId: mode === 'separates' ? currentBottom?.id : undefined,
    dressId: mode === 'dress' ? currentDress?.id : undefined,
    shoesId: currentShoes?.id,
    bagId: currentBag?.id,
  }

  const isComplete =
    mode === 'dress' ? !!candidate.dressId : !!candidate.topId && !!candidate.bottomId

  const isDuplicate =
    isComplete &&
    outfits.some(
      (o) =>
        o.hatId === candidate.hatId &&
        o.topId === candidate.topId &&
        o.bottomId === candidate.bottomId &&
        o.dressId === candidate.dressId &&
        o.shoesId === candidate.shoesId &&
        o.bagId === candidate.bagId,
    )

  async function handleSave() {
    if (!isComplete || isDuplicate) return
    await saveOutfit(candidate)
    setToast('Saved!')
  }

  return (
    <div className="screen build-screen">
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
            className={'mode-toggle-btn' + (mode === 'dress' ? ' active' : '')}
            onClick={() => setMode('dress')}
          >
            Dresses
          </button>
        </div>
      </div>

      <div className="build-stage">
        <Band
          items={hatsWithNone}
          onIndexChange={setHatIndex}
          emptyLabel="No hats yet"
          noneLabel="No hat"
          accessory
        />

        {mode === 'separates' ? (
          <>
            <Band
              ref={topBandRef}
              items={tops}
              onIndexChange={setTopIndex}
              emptyLabel="No tops yet — add some in Closet"
              matchWidth={pairedWidth}
            />
            <Band
              items={bottoms}
              onIndexChange={setBottomIndex}
              emptyLabel="No bottoms yet — add some in Closet"
              matchWidth={pairedWidth}
            />
          </>
        ) : (
          <Band
            items={dresses}
            onIndexChange={setDressIndex}
            emptyLabel="No dresses yet — add some in Closet"
          />
        )}

        <Band
          items={shoesWithNone}
          onIndexChange={setShoesIndex}
          emptyLabel="No shoes yet"
          noneLabel="No shoes"
          accessory
        />

        <Band
          items={bagsWithNone}
          onIndexChange={setBagIndex}
          emptyLabel="No bags yet"
          noneLabel="No bag"
          accessory
        />
      </div>

      <button className="save-fab" disabled={!isComplete || isDuplicate} onClick={handleSave}>
        {isDuplicate ? 'Already saved' : 'Save'}
      </button>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
