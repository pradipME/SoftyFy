import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DebugOverlay } from './components/debug/DebugOverlay'
import { PlayerProvider } from './context/PlayerContext'
import { HomePage } from './pages/Home'
import { LibraryPage } from './pages/Library'
import { QwaliPage } from './pages/Qwali'
import { SearchPage } from './pages/Search'

function LaunchToHome() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Launch redirect, not a route guard: runs once on mount so a restored
    // session hash (e.g. /#/library) lands on Home, while in-app navigation
    // to Library/Search/Qwali keeps working.
    if (location.pathname !== '/') navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <LaunchToHome />
        <PlayerProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="qwali" element={<QwaliPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <DebugOverlay />
        </PlayerProvider>
      </HashRouter>
    </MotionConfig>
  )
}
