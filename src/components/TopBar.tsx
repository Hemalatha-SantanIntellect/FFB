import { useEffect, useRef, useState } from 'react'

import { Search } from 'lucide-react'

import finleyLogo from '@/assets/finley logo.jpg'
import { routes, type Asset } from '@/data/mockData'
import { cn } from '@/lib/utils'

type TopBarProps = {
  search: string
  onSearchChange: (value: string) => void
  searchSuggestions: Asset[]
  onPickSearchAsset: (asset: Asset) => void
  selectedRoute: string
  onRouteChange: (value: string) => void
}

export function TopBar({
  search,
  onSearchChange,
  searchSuggestions,
  onPickSearchAsset,
  selectedRoute,
  onRouteChange,
}: TopBarProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

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
    <header className="border-b border-neutral-200/70 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1760px] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3">
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
          <img
            src={finleyLogo}
            alt="Finley"
            className="h-9 w-auto max-h-10 max-w-[min(160px,40vw)] object-contain object-left"
            width={160}
            height={40}
            decoding="async"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
              Fusion Center
            </p>
            <p className="text-sm font-medium text-neutral-600">Executive overview</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-4">
          <div ref={wrapRef} className="relative w-full max-w-[240px] sm:max-w-[500px] sm:min-w-[200px]">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-neutral-500"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search assets"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (search.trim().length > 0) setOpen(true)
              }}
              autoComplete="off"
              role="combobox"
              aria-expanded={open && showList}
              aria-controls="asset-search-listbox"
              aria-autocomplete="list"
              className="relative z-0 h-9 w-full rounded-md border border-neutral-200/80 bg-white pl-8 pr-3 text-[13px] font-medium text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-500 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300"
            />

            {open && showList ? (
              <div
                id="asset-search-listbox"
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[min(320px,50vh)] overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
              >
                {!hasMatches ? (
                  <p className="px-3 py-2 text-[13px] text-neutral-600">No matching assets</p>
                ) : (
                  searchSuggestions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      role="option"
                      className={cn(
                        'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-[13px] text-neutral-900',
                        'hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none',
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onPickSearchAsset(a)
                        setOpen(false)
                      }}
                    >
                      <span className="font-semibold">{a.name}</span>
                      <span className="text-[11px] font-medium text-neutral-600">
                        {a.id} · {a.route}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="route-filter" className="text-[11px] font-semibold text-neutral-700">
              Filter by Route
            </label>
            <select
              id="route-filter"
              value={selectedRoute}
              onChange={(e) => onRouteChange(e.target.value)}
              className="h-9 min-w-[200px] rounded-md border border-neutral-200/80 bg-white px-2.5 text-[13px] text-neutral-900 outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300"
            >
              {routes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  )
}
