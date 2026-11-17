import { CampStateProvider } from './i18n/CampState'
import { CampMap3D } from './map/CampMap3D'

export default function App() {
  return (
    <CampStateProvider>
      <div className="fixed inset-0">
        <CampMap3D />
      </div>
    </CampStateProvider>
  )
}
