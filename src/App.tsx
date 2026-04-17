import { useEffect, useMemo, useState } from 'react'

// import { AssetHealthPanel } from '@/components/AssetHealthPanel'
// import { GeoMapPanel } from '@/components/GeoMapPanel'
// In App.tsx
import { GeoMapPanel2 } from './components/GeoMapPanel2'
import { KPIStrip } from '@/components/KPIStrip'
import { OperationalInfo } from '@/components/OperationalInfo'
import { PriorityActions } from '@/components/PriorityActions'
import { SecurityPosture } from '@/components/SecurityPosture'
import { ThreatFeed } from '@/components/ThreatFeed'
import { TopBar } from '@/components/TopBar'
import {
  assets as allAssets,
  controlMetrics,
  countByStatus,
  fleetAverages,
  securityEvents,
  type Asset,
} from '@/data/mockData'
import { filterAssetsByRoute } from '@/lib/assetFilters'
import { SensorHealthStrip } from './components/SensorHealthStrip'
import { AssetHealthPanel2 } from './components/AssetHealthPanel2'

function applySearch(assetsList: Asset[], q: string): Asset[] {
  const s = q.trim().toLowerCase()
  if (!s) return assetsList
  return assetsList.filter(
    (a) =>
      a.name.toLowerCase().includes(s) ||
      a.id.toLowerCase().includes(s) ||
      a.route.toLowerCase().includes(s),
  )
}

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(() => allAssets[0])
  const [selectedRoute, setSelectedRoute] = useState('All Routes')
  const [search, setSearch] = useState('')

  const routeFilteredAssets = useMemo(
    () => filterAssetsByRoute(allAssets, selectedRoute),
    [selectedRoute],
  )

  const searchSuggestions = useMemo(() => {
    if (search.trim().length === 0) return []
    return applySearch(routeFilteredAssets, search)
  }, [routeFilteredAssets, search])

  const fleetKpis = useMemo(() => {
    const c = countByStatus(allAssets)
    const avg = fleetAverages(allAssets)
    return {
      ...c,
      avgHealth: avg.health,
      avgSecurity: avg.security,
      alerts: securityEvents.length,
    }
  }, [])

  useEffect(() => {
    if (routeFilteredAssets.length === 0) return
    const stillVisible = routeFilteredAssets.some((a) => a.id === selectedAsset.id)
    if (!stillVisible) {
      setSelectedAsset(routeFilteredAssets[0])
    }
  }, [routeFilteredAssets, selectedAsset.id])

  return (
    <div className="min-h-svh bg-[#f4f4f2] text-neutral-900 antialiased">
      <TopBar
        search={search}
        onSearchChange={setSearch}
        searchSuggestions={searchSuggestions}
        onPickSearchAsset={(a) => {
          setSelectedAsset(a)
          setSearch('')
        }}
        selectedRoute={selectedRoute}
        onRouteChange={setSelectedRoute}
      />

      <main className="mx-auto flex max-w-[1760px] flex-col gap-3 px-5 py-4">
        <KPIStrip
          // monitored={fleetKpis.total}
          // avgHealth={fleetKpis.avgHealth}
          avgSecurity={fleetKpis.avgSecurity}
          // warningCount={fleetKpis.warning}
          // criticalCount={fleetKpis.critical}
          alertCount={fleetKpis.alerts}
        />

  

        <div className="grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(260px,3fr)]">
          {/* <GeoMapPanel
            assets={routeFilteredAssets}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
            routeScope={selectedRoute}
          /> */}
          <GeoMapPanel2 />
          {/* <AssetHealthPanel /> */}
          <AssetHealthPanel2 />
        </div>

              {/* The new Sensor Health monitoring strip */}
  <SensorHealthStrip />

        <div className="grid gap-3 lg:grid-cols-3">
          <ThreatFeed events={securityEvents} />
          <OperationalInfo asset={selectedAsset} />
          <PriorityActions />
        </div>

        <SecurityPosture metrics={controlMetrics} />
      </main>
    </div>
  )
}
