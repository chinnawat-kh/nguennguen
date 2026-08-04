import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LanguageProvider from './i18n/LanguageProvider'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import ToastProvider from './components/ToastProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </LanguageProvider>
  </StrictMode>
)
