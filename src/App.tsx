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
import { GeoMapPanel3D } from './components/GeoMap3D'
import { cn } from '@/lib/utils'
import {ShieldCheck} from 'lucide-react'

// function applySearch(assetsList: Asset[], q: string): Asset[] {
//   const s = q.trim().toLowerCase()
//   if (!s) return assetsList
//   return assetsList.filter(
//     (a) =>
//       a.name.toLowerCase().includes(s) ||
//       a.id.toLowerCase().includes(s) ||
//       a.route.toLowerCase().includes(s),
//   )
// }

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(() => allAssets[0])
  const [selectedRoute, setSelectedRoute] = useState('All Routes')
  // const [search, setSearch] = useState('')
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D');

  const routeFilteredAssets = useMemo(
    () => filterAssetsByRoute(allAssets, selectedRoute),
    [selectedRoute],
  )

  // const searchSuggestions = useMemo(() => {
  //   if (search.trim().length === 0) return []
  //   return applySearch(routeFilteredAssets, search)
  // }, [routeFilteredAssets, search])

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
        // search={search}
        // onSearchChange={setSearch}
        // searchSuggestions={searchSuggestions}
        // onPickSearchAsset={(a) => {
        //   setSelectedAsset(a)
        //   setSearch('')
        // }}
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


        <div className="flex flex-col gap-3">
              {/* Map Header with Toggle */}
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200/70 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
                    Network Topography {mapMode}
                  </h2>
                </div>
                
                <div className="flex bg-neutral-100 p-1 rounded-md border border-neutral-200">
                  <button
                    onClick={() => setMapMode('2D')}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all",
                      mapMode === '2D' ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                    )}
                  >
                    2D View
                  </button>
                  <button
                    onClick={() => setMapMode('3D')}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all",
                      mapMode === '3D' ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                    )}
                  >
                    3D View
                  </button>
                </div>
              </div>

              {/* Existing Grid Layout */}
              <div className="grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(260px,3fr)]">
                {mapMode === '3D' ? (
                  <GeoMapPanel3D />
                ) : (
                  <GeoMapPanel2 />
                )}
                <AssetHealthPanel2 />
              </div>
            </div>

       

              {/* The new Sensor Health monitoring strip */}
  <SensorHealthStrip />

  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-500" />
            Security Monitoring Metrics
          </h3>

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
