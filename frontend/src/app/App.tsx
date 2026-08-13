import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AudioPlayerProvider } from '../state/PlayerContext'
import { HomePage } from '../pages/HomePage'
import { SongsPage } from '../pages/SongsPage'
import { ArtistsPage } from '../pages/ArtistsPage'
import { ArtistDetailPage } from '../pages/ArtistDetailPage'
import { AlbumsPage } from '../pages/AlbumsPage'
import { AlbumDetailPage } from '../pages/AlbumDetailPage'
import { PlaylistsPage } from '../pages/PlaylistsPage'
import { PlaylistDetailPage } from '../pages/PlaylistDetailPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { NowPlayingPage } from '../pages/NowPlayingPage'
import { NotFoundPage } from '../pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <AudioPlayerProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="songs" element={<SongsPage />} />
            <Route path="artists" element={<ArtistsPage />} />
            <Route path="artists/:id" element={<ArtistDetailPage />} />
            <Route path="albums" element={<AlbumsPage />} />
            <Route path="albums/:id" element={<AlbumDetailPage />} />
            <Route path="playlists" element={<PlaylistsPage />} />
            <Route path="playlists/:id" element={<PlaylistDetailPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="now-playing" element={<NowPlayingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AudioPlayerProvider>
    </BrowserRouter>
  )
}

export default App
