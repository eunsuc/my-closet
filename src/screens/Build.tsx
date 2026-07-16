import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Band } from '../components/Band'
import { saveOutfit } from '../lib/repo'
import type { Item } from '../types'

type Mode = 'separates' | 'dress'

const BOTTOM_TO_TOP_RATIO = 1.5
const MAX_TOP_WIDTH = 0.5
const MIN_TOP_WIDTH = 0.12

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

  // Bottom is always BOTTOM_TO_TOP_RATIO times Top's width, but neither may exceed
  // what actually fits within the band's real height for its own real aspect ratio —
  // so topWidth is solved from both constraints at once, and bottomWidth follows.
  useEffect(() => {
    const el = topBandRef.current
    if (!el) return
    // ResizeObserver catches every layout change to the band's box — not just
    // window resizes, but also the flex reflow that happens as hat/shoes/bag
    // data loads in asynchronously and shifts how much height Top/Bottom get.
    // A plain 'resize' listener misses that, so the measurement could go stale.
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setPairedBandSize({ w: width, h: height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode])

  const topWidth = useMemo(() => {
    if (!pairedBandSize) return MAX_TOP_WIDTH
    let maxTop = MAX_TOP_WIDTH
    if (topAspect) {
      const safeTop = (pairedBandSize.h * topAspect) / pairedBandSize.w
      maxTop = Math.min(maxTop, safeTop)
    }
    if (bottomAspect) {
      const safeBottom = (pairedBandSize.h * bottomAspect) / pairedBandSize.w
      maxTop = Math.min(maxTop, safeBottom / BOTTOM_TO_TOP_RATIO)
    }
    return Math.max(MIN_TOP_WIDTH, maxTop)
  }, [pairedBandSize, topAspect, bottomAspect])

  const bottomWidth = topWidth * BOTTOM_TO_TOP_RATIO

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
              matchWidth={topWidth}
            />
            <Band
              items={bottoms}
              onIndexChange={setBottomIndex}
              emptyLabel="No bottoms yet — add some in Closet"
              matchWidth={bottomWidth}
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
