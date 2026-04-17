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
      <header className="border-b border-neutral-200/70 bg-white/90 backdrop-blur-sm relative z-40">
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3">
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
            <img
              src={finleyLogo}
              alt="Finley"
              className="h-9 w-auto max-h-10 object-contain object-left"
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                Fusion Center
              </p>
              <p className="text-sm font-medium text-neutral-600">Infrastructure Intelligence</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-4">
            {/* Search Container */}
            <div ref={wrapRef} className="relative w-full max-w-[240px] sm:max-w-[500px] sm:min-w-[200px]">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-neutral-500"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search by RID or Asset Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => { if (search.trim().length > 0) setOpen(true) }}
                autoComplete="off"
                className="relative z-0 h-9 w-full rounded-md border border-neutral-200/80 bg-white pl-8 pr-3 text-[13px] font-medium text-neutral-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />

              {/* Suggestions Dropdown (Z-Level 50) */}
              {open && showList && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[320px] overflow-auto rounded-lg border border-neutral-200 bg-white py-2 shadow-2xl animate-in fade-in slide-in-from-top-1">
                  {!hasMatches ? (
                    <p className="px-4 py-3 text-[13px] text-neutral-500 italic">No matching infrastructure found</p>
                  ) : (
                    searchSuggestions.map((a) => (
                      <button
                        key={a.rid}
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors"
                        onClick={() => {
                          setSelectedAsset(a)
                          setOpen(false)
                          setSearch('')
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-neutral-900 truncate">{a.name_as || 'Unnamed Node'}</p>
                          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-tight">{a.rid} • {a.category}</p>
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
              <label htmlFor="route-filter" className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Route
              </label>
              <select
                id="route-filter"
                value={selectedRoute}
                onChange={(e) => onRouteChange(e.target.value)}
                className="h-9 min-w-[160px] rounded-md border border-neutral-200/80 bg-white px-2.5 text-[13px] font-bold text-neutral-800 outline-none focus:border-blue-400"
              >
                {routes.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Asset Detail Pop-up (Z-Level 100) */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-neutral-900 px-6 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-600 p-2">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">{selectedAsset.name_as || 'Asset Details'}</h2>
                  <p className="text-[11px] font-mono text-neutral-400 uppercase">{selectedAsset.rid} • {selectedAsset.guid}</p>
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
                    <Info className="h-4 w-4 text-blue-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">General Info</h3>
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
                    <MapPin className="h-4 w-4 text-rose-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Geo & Connectivity</h3>
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
                  <FileText className="h-4 w-4 text-neutral-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Raw Technical Metadata</h3>
                </div>
                <pre className="rounded-lg bg-neutral-50 p-4 text-[11px] font-mono leading-relaxed text-neutral-700 overflow-x-auto border">
                  {JSON.stringify(selectedAsset, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-neutral-50 border-t px-6 py-4 flex justify-end">
              <button 
                onClick={() => setSelectedAsset(null)}
                className="rounded-lg bg-neutral-900 px-6 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
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
    <div className="flex justify-between items-center text-xs">
      <span className="font-semibold text-neutral-400 uppercase tracking-tighter">{label}</span>
      <span className={cn(
        "font-bold text-neutral-900",
        highlight && "text-emerald-600 uppercase"
      )}>{value}</span>
    </div>
  )
}