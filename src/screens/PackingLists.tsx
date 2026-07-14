import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { NewPackingListSheet } from '../components/NewPackingListSheet'

export default function PackingLists() {
  const [showNew, setShowNew] = useState(false)
  const navigate = useNavigate()
  const lists = useLiveQuery(() => db.packingLists.orderBy('createdAt').reverse().toArray())

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-title">Packing</div>
      </div>

      {lists && lists.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 40 }}>🧳</div>
          <div>No packing lists yet. Tap + to start one for a trip.</div>
        </div>
      )}

      <div className="packing-list-overview">
        {lists?.map((list) => {
          const packed = list.entries.filter((e) => e.packed).length
          return (
            <button
              key={list.id}
              className="packing-list-row"
              onClick={() => navigate(`/packing/${list.id}`)}
            >
              <div className="packing-list-row-name">{list.name}</div>
              <div className="packing-list-row-progress">
                {list.entries.length === 0 ? 'Empty' : `${packed} / ${list.entries.length} packed`}
              </div>
            </button>
          )
        })}
      </div>

      <button className="fab" onClick={() => setShowNew(true)}>
        +
      </button>

      {showNew && <NewPackingListSheet onClose={() => setShowNew(false)} />}
    </div>
  )
}
