import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { TopBar } from '@/components/TopBar'
import { ClientPortalPage } from '@/pages/ClientPortalPage'
import { CommandCenterPage } from '@/pages/CommandCenterPage'
// import { EventsHistoryPage } from '@/pages/EventsHistoryPage'
import { EventsHistoryPage2 } from '@/pages/EventsHistoryPage2'
import { OperationsDashboardPage } from '@/pages/OperationsDashboardPage'

export default function App() {
  const [selectedRoute, setSelectedRoute] = useState('All Routes')

  return (
    <div className="fc-shell">
      <TopBar
        selectedRoute={selectedRoute}
        onRouteChange={setSelectedRoute}
      />
      <Routes>
        <Route path="/" element={<OperationsDashboardPage selectedRoute={selectedRoute} />} />
        <Route path="/client-portal" element={<ClientPortalPage selectedRoute={selectedRoute} />} />
        <Route path="/command-center" element={<CommandCenterPage selectedRoute={selectedRoute} />} />
        <Route path="/events-history" element={<EventsHistoryPage2 />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
