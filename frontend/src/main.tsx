import { useEffect } from 'react'

let deferredPrompt: any = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('debug: beforeinstallprompt fired')
    e.preventDefault()
    // Store globally for any later access.
    ;(window as any).deferredPrompt = e
    // Emit a custom event so any listeners (e.g., InstallPrompt) can pick it up.
    window.dispatchEvent(new CustomEvent('deferredprompt', { detail: e }))
  })
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

