import { useEffect, useMemo, useState } from 'react'

// import { AssetHealthPanel } from '@/components/AssetHealthPanel'
// import { GeoMapPanel } from '@/components/GeoMapPanel'
// In App.tsx
import { GeoMapPanel2 } from './components/GeoMapPanel2'
import { KPIStrip } from '@/components/KPIStrip'
import { SecurityPosture } from '@/components/SecurityPosture'
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
import { AgentConfigModal } from './components/AgentConfigModal'
import {ShieldCheck} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { eventSeverityBadgeClass } from '@/lib/severityChips'

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

const SECURITY_POSTURE_LEGEND = [
  { label: '≥80%', swatch: 'bg-emerald-500', title: 'Strong' },
  { label: '65–79%', swatch: 'bg-sky-500', title: 'Good' },
  { label: '50–64%', swatch: 'bg-amber-500', title: 'Watch' },
  { label: '<50%', swatch: 'bg-rose-500', title: 'At risk' },
] as const

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(() => allAssets[0])
  const [selectedRoute, setSelectedRoute] = useState('All Routes')
  // const [search, setSearch] = useState('')
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D')

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
    <div className="fc-shell">
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

      <main className="mx-auto flex w-full max-w-[1760px] flex-col gap-4 px-3 py-4 sm:px-5 sm:py-5">
        <KPIStrip
          // monitored={fleetKpis.total}
          // avgHealth={fleetKpis.avgHealth}
          avgSecurity={fleetKpis.avgSecurity}
          // warningCount={fleetKpis.warning}
          // criticalCount={fleetKpis.critical}
          alertCount={fleetKpis.alerts}
        />


        <section className="flex flex-col gap-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
            {mapMode === '3D' ? (
              <GeoMapPanel3D
                selectedRoute={selectedRoute}
                mapMode={mapMode}
                onMapModeChange={setMapMode}
              />
            ) : (
              <GeoMapPanel2 mapMode={mapMode} onMapModeChange={setMapMode} />
            )}
            <AssetHealthPanel2 />
          </div>
        </section>

       

              {/* The new Sensor Health monitoring strip */}
        <SensorHealthStrip />

        <section className="fc-panel p-3 sm:p-4">
          <h3 className="fc-eyebrow mb-3 flex items-center gap-2 text-[11px]">
            <ShieldCheck className="h-4 w-4 text-sky-600" />
            Security monitoring metrics
          </h3>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Live threat signals
                </p>
                <p className="text-[11px] font-semibold text-slate-700">{securityEvents.length} events</p>
              </div>
              <div className="space-y-2">
                {securityEvents.slice(0, 6).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-900">{ev.title}</p>
                      <p className="truncate text-[11px] text-slate-600">{ev.asset}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        className={cn(
                          'rounded-md px-1.5 text-[9px] font-semibold uppercase',
                          eventSeverityBadgeClass(ev.severity),
                        )}
                      >
                        {ev.severity}
                      </Badge>
                      <span className="text-[10px] font-medium text-slate-500">{ev.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Executive snapshot
              </p>
              <div className="space-y-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                  <p className="text-[11px] font-semibold text-slate-900">{selectedAsset.name}</p>
                  <p className="text-[10px] text-slate-600">{selectedAsset.assetType}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                    <p className="text-[9px] font-semibold uppercase text-slate-500">Status</p>
                    <p className="text-[11px] font-semibold capitalize text-slate-800">{selectedAsset.status}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                    <p className="text-[9px] font-semibold uppercase text-slate-500">Threat</p>
                    <p className="text-[11px] font-semibold text-slate-800">{selectedAsset.threatLevel}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">Priority actions</p>
                  <ul className="mt-1 space-y-1 text-[11px] text-slate-700">
                    <li>CAB-12 and PED-12 require immediate site inspection.</li>
                    <li>Degradation on TRANS-17 requires preventive maintenance.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fc-panel p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="fc-eyebrow flex items-center gap-2 text-[11px]">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              Security posture
            </h3>
            <div
              className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] font-medium text-slate-600"
              aria-label="Score band legend"
            >
              {SECURITY_POSTURE_LEGEND.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap"
                  title={`${item.title}: ${item.label}`}
                >
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-sm shadow-sm', item.swatch)}
                    aria-hidden
                  />
                  <span className="font-semibold tabular-nums text-slate-700">{item.label}</span>
                </span>
              ))}
            </div>
          </div>
          <SecurityPosture metrics={controlMetrics} />
        </section>
      </main>

      <AgentConfigModal />
    </div>
  )
}
