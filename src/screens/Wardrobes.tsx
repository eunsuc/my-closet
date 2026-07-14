import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { NewWardrobeSheet } from '../components/NewWardrobeSheet'
import { SuitcaseIcon } from '../components/icons'

export default function Wardrobes() {
  const [showNew, setShowNew] = useState(false)
  const navigate = useNavigate()
  const wardrobes = useLiveQuery(() => db.wardrobes.orderBy('createdAt').reverse().toArray())

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-title">Wardrobes</div>
      </div>

      {wardrobes && wardrobes.length === 0 && (
        <div className="empty-state">
          <SuitcaseIcon size={40} />
          <div>
            No wardrobes yet. Tap + to start one — like "To Sell", "Brisbane", or "Someone
            else's".
          </div>
        </div>
      )}

      <div className="packing-list-overview">
        {wardrobes?.map((wardrobe) => {
          const packed = wardrobe.entries.filter((e) => e.packed).length
          return (
            <button
              key={wardrobe.id}
              className="packing-list-row"
              onClick={() => navigate(`/wardrobes/${wardrobe.id}`)}
            >
              <div className="packing-list-row-name">{wardrobe.name}</div>
              <div className="packing-list-row-progress">
                {wardrobe.entries.length === 0
                  ? 'Empty'
                  : wardrobe.packingMode
                    ? `${packed} / ${wardrobe.entries.length} packed`
                    : `${wardrobe.entries.length} item${wardrobe.entries.length === 1 ? '' : 's'}`}
              </div>
            </button>
          )
        })}
      </div>

      <button className="fab" onClick={() => setShowNew(true)}>
        +
      </button>

      {showNew && <NewWardrobeSheet onClose={() => setShowNew(false)} />}
    </div>
  )
}
