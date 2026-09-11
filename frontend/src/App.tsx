import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { PlayerProvider } from './context/PlayerContext'
import { HomePage } from './pages/Home'
import { LibraryPage } from './pages/Library'
import { QwaliPage } from './pages/Qwali'
import { SearchPage } from './pages/Search'

function LaunchToHome() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Launches always land on Home even when the browser/PWA restores a
    // previous session's hash (e.g. /#/library).
    if (location.pathname !== '/') navigate('/', { replace: true })
  }, [location.pathname, navigate])

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
        </PlayerProvider>
      </HashRouter>
    </MotionConfig>
  )
}
