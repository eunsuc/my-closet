import { NavLink, Route, Routes } from 'react-router-dom'
import Closet from './screens/Closet'
import Build from './screens/Build'
import Outfits from './screens/Outfits'
import PackingLists from './screens/PackingLists'
import PackingListDetail from './screens/PackingListDetail'

const TABS = [
  { to: '/', label: 'Closet', icon: '👕' },
  { to: '/build', label: 'Build', icon: '🪞' },
  { to: '/outfits', label: 'Outfits', icon: '📸' },
  { to: '/packing', label: 'Packing', icon: '🧳' },
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
            <span className="tab-bar-icon">{tab.icon}</span>
            <span className="tab-bar-label">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
