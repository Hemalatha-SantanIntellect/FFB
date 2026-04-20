import { useEffect, useRef, useState, useMemo } from 'react'
import { Search, X, MapPin, Cpu, Info, FileText } from 'lucide-react'
import finleyLogo from '@/assets/finley logo.jpg'
import { routes } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// Data Import
import fundingData from '@/data/fin_funding.json'

type TopBarProps = {
  selectedRoute: string
  onRouteChange: (value: string) => void
}

export function TopBar({
  selectedRoute,
  onRouteChange,
}: TopBarProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Flatten funding data for searching
  const allAssets = useMemo(() => {
    const flat: any[] = []
    Object.entries(fundingData).forEach(([category, items]: [string, any]) => {
      items.forEach((item: any) => {
        flat.push({ ...item, category })
      })
    })
    return flat
  }, [])

  // Search logic: Filter by Name or RID
  const searchSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return allAssets.filter(
      (a) => 
        a.name_as?.toLowerCase().includes(query) || 
        a.rid?.toLowerCase().includes(query)
    ).slice(0, 8) // Limit results for performance
  }, [search, allAssets])

  const showList = search.trim().length > 0
  const hasMatches = searchSuggestions.length > 0

  useEffect(() => {
    setOpen(showList)
  }, [showList])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center gap-x-4 gap-y-3 px-3 py-3 sm:px-5">
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
            <img
              src={finleyLogo}
              alt="Finley"
              className="h-9 w-auto max-h-10 object-contain object-left"
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                Fusion Center
              </p>
              <p className="text-sm font-medium text-slate-600">Broadband Infrastructure Intelligence</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-4">
            {/* Search Container */}
            <div ref={wrapRef} className="relative w-full max-w-[240px] sm:max-w-[460px] sm:min-w-[220px]">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search by RID or Asset Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => { if (search.trim().length > 0) setOpen(true) }}
                autoComplete="off"
                className="relative z-0 h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] font-medium text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />

              {/* Suggestions Dropdown (Z-Level 50) */}
              {open && showList && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[320px] overflow-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl animate-in fade-in slide-in-from-top-1">
                  {!hasMatches ? (
                    <p className="px-4 py-3 text-[13px] italic text-slate-500">No matching infrastructure found</p>
                  ) : (
                    searchSuggestions.map((a) => (
                      <button
                        key={a.rid}
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                        onClick={() => {
                          setSelectedAsset(a)
                          setOpen(false)
                          setSearch('')
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-900">{a.name_as || 'Unnamed Node'}</p>
                          <p className="text-[11px] font-medium uppercase tracking-tight text-slate-500">{a.rid} • {a.category}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] ml-2 shrink-0">{a.lifecycle_state}</Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Existing Route Filter */}
            <div className="flex shrink-0 items-center gap-2">
              <label htmlFor="route-filter" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Route
              </label>
              <select
                id="route-filter"
                value={selectedRoute}
                onChange={(e) => onRouteChange(e.target.value)}
                className="h-9 min-w-[160px] rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {routes.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Asset Detail Pop-up (Z-Level 100) */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-900 px-6 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-sky-600 p-2">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">{selectedAsset.name_as || 'Asset Details'}</h2>
                  <p className="text-[11px] font-mono uppercase text-slate-300">{selectedAsset.rid} • {selectedAsset.guid}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                className="rounded-full p-1.5 transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Core Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Info className="h-4 w-4 text-sky-600" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">General Info</h3>
                  </div>
                  <div className="space-y-3">
                    <DetailRow label="Layer" value={selectedAsset.category} />
                    <DetailRow label="Status" value={selectedAsset.lifecycle_state} highlight />
                    <DetailRow label="Exchange" value={selectedAsset.exchange || 'N/A'} />
                    <DetailRow label="Updated" value={new Date(selectedAsset.updated).toLocaleString()} />
                  </div>
                </div>

                {/* Section 2: Location & Connectivity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <MapPin className="h-4 w-4 text-sky-600" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Geo & Connectivity</h3>
                  </div>
                  <div className="space-y-3">
                    <DetailRow label="Lat" value={selectedAsset.geometry?.y || selectedAsset.geometry?.paths?.[0][0][1]} />
                    <DetailRow label="Lng" value={selectedAsset.geometry?.x || selectedAsset.geometry?.paths?.[0][0][0]} />
                    <DetailRow label="Logic" value={selectedAsset.connectivity_logic ? "Registered" : "None"} />
                    <DetailRow label="Security" value={selectedAsset.security_label} />
                  </div>
                </div>
              </div>

              {/* RAW Metadata Preview */}
              <div className="mt-8">
                <div className="flex items-center gap-2 border-b pb-2 mb-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Raw Technical Metadata</h3>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-slate-50 p-4 text-[11px] font-mono leading-relaxed text-slate-700">
                  {JSON.stringify(selectedAsset, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t bg-slate-50 px-6 py-4">
              <button 
                onClick={() => setSelectedAsset(null)}
                className="rounded-lg bg-slate-900 px-6 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                CLOSE PREVIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DetailRow({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-semibold uppercase tracking-tighter text-slate-400">{label}</span>
      <span className={cn(
        'font-semibold text-slate-900',
        highlight && 'text-emerald-600 uppercase'
      )}>{value}</span>
    </div>
  )
}