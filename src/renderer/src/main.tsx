import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LanguageProvider from './i18n/LanguageProvider'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
)
