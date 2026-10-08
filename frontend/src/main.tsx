import './lib/storageMigration'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
import { detectLanguage } from './lib/i18n'
import { applyDateLocale } from './lib/locale'

const language = detectLanguage()
applyDateLocale(language)
document.documentElement.lang = language

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registered relative to the document so it works from any GitHub Pages sub-path.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // A missing or blocked service worker only costs offline support.
    })
  })
}
