import { NavLink, Route, Routes } from 'react-router-dom'
import Closet from './screens/Closet'
import Build from './screens/Build'
import Outfits from './screens/Outfits'
import PackingLists from './screens/PackingLists'
import PackingListDetail from './screens/PackingListDetail'
import { HangerIcon, MirrorIcon, FrameIcon, SuitcaseIcon } from './components/icons'

const TABS = [
  { to: '/', label: 'Closet', Icon: HangerIcon },
  { to: '/build', label: 'Build', Icon: MirrorIcon },
  { to: '/outfits', label: 'Outfits', Icon: FrameIcon },
  { to: '/packing', label: 'Packing', Icon: SuitcaseIcon },
]

export default function App() {
  return (
    <div className="app">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Closet />} />
          <Route path="/build" element={<Build />} />
          <Route path="/outfits" element={<Outfits />} />
          <Route path="/packing" element={<PackingLists />} />
          <Route path="/packing/:id" element={<PackingListDetail />} />
        </Routes>
      </main>
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => 'tab-bar-item' + (isActive ? ' active' : '')}
          >
            <span className="tab-bar-icon">
              <tab.Icon />
            </span>
            <span className="tab-bar-label">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
