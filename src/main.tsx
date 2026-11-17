import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CampStateProvider } from './i18n/CampState'
import { HomePage } from './pages/HomePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CampStateProvider page="home">
      <HomePage />
    </CampStateProvider>
  </StrictMode>,
)
