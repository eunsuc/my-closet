import { useEffect, useRef } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Closet from './screens/Closet'
import Build from './screens/Build'
import Outfits from './screens/Outfits'
import Wardrobes from './screens/Wardrobes'
import WardrobeDetail from './screens/WardrobeDetail'
import { HangerIcon, MirrorIcon, FrameIcon, SuitcaseIcon } from './components/icons'

const TABS = [
  { to: '/', label: 'Closet', Icon: HangerIcon },
  { to: '/build', label: 'Build', Icon: MirrorIcon },
  { to: '/outfits', label: 'Outfits', Icon: FrameIcon },
  { to: '/wardrobes', label: 'Wardrobes', Icon: SuitcaseIcon },
]

export default function App() {
  const tabBarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    function measure() {
      const height = tabBarRef.current?.getBoundingClientRect().height
      if (height) document.documentElement.style.setProperty('--tab-bar-height', `${height}px`)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <div className="app">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Closet />} />
          <Route path="/build" element={<Build />} />
          <Route path="/outfits" element={<Outfits />} />
          <Route path="/wardrobes" element={<Wardrobes />} />
          <Route path="/wardrobes/:id" element={<WardrobeDetail />} />
        </Routes>
      </main>
      <nav className="tab-bar" ref={tabBarRef}>
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
