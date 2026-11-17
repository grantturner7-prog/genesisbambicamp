import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CampStateProvider } from './i18n/CampState'
import { FacilitiesPage } from './pages/FacilitiesPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CampStateProvider page="facilities">
      <FacilitiesPage />
    </CampStateProvider>
  </StrictMode>,
)
