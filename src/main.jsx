import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import App from './App'
import './styles/tokens.css'
import './styles/base.css'

// A deploy renames hashed chunks; a tab opened before it can't fetch the old
// names (lazy imports fail with "Failed to fetch dynamically imported module").
// Vite reports that here — one reload picks up the new build. The flag stops a loop.
window.addEventListener('vite:preloadError', (e) => {
  let done = false
  try { done = !!sessionStorage.getItem('wandra-preload-reloaded'); if (!done) sessionStorage.setItem('wandra-preload-reloaded', '1') } catch { /* ignore */ }
  if (!done) { e.preventDefault(); window.location.reload() }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
)
