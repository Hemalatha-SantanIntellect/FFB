import 'maplibre-gl/dist/maplibre-gl.css'

import maplibregl from 'maplibre-gl'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import { Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Layer, ScaleControl, Source } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from '@/components/ui/progress'
import { DEFAULT_MAP_VIEW, ROUTE_DEFINITIONS, type Asset, type AssetStatus } from '@/data/mockData'
import {
  ASSET_TYPE_COLORS,
  ROUTE_LINE_COLORS,
  buildRouteLineCollection,
  buildAssetPointsCollection,
} from '@/lib/mapAssetGeoJSON'
import { registerAssetTypeIcons } from '@/lib/mapAssetIcons'
import { cn } from '@/lib/utils'

const MINIMAL_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

function statusBadgeClass(status: AssetStatus) {
  switch (status) {
    case 'healthy':
      return 'border-emerald-200/90 bg-emerald-50 text-emerald-900'
    case 'warning':
      return 'border-amber-200/90 bg-amber-50 text-amber-900'
    case 'critical':
    default:
      return 'border-rose-200/90 bg-rose-50 text-rose-900'
  }
}

type GeoMapPanelProps = {
  assets: Asset[]
  selectedAsset: Asset
  onSelectAsset: (asset: Asset) => void
  routeScope: string
}

export function GeoMapPanel({
  assets,
  selectedAsset,
  onSelectAsset,
  routeScope,
}: GeoMapPanelProps) {
  const mapRef = useRef<MapRef>(null)
  const prevRouteScope = useRef(routeScope)
  const skipFlyToAfterFit = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [iconsReady, setIconsReady] = useState(false)

  const pointsGeoJson = useMemo(
    () => buildAssetPointsCollection(assets, selectedAsset.id),
    [assets, selectedAsset.id],
  )

  const linesGeoJson = useMemo(() => buildRouteLineCollection(assets), [assets])

  const healthy = assets.filter((a) => a.status === 'healthy').length
  const warning = assets.filter((a) => a.status === 'warning').length
  const critical = assets.filter((a) => a.status === 'critical').length

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const f = e.features?.[0]
      const id = f?.properties?.id as string | undefined
      if (!id) return
      const asset = assets.find((a) => a.id === id)
      if (asset) onSelectAsset(asset)
    },
    [assets, onSelectAsset],
  )

  const onMapMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const hit = (e.features?.length ?? 0) > 0
    e.target.getCanvas().style.cursor = hit ? 'pointer' : ''
  }, [])

  const zoomBy = useCallback((delta: number) => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const z = map.getZoom()
    map.easeTo({ zoom: z + delta, duration: 220, essential: true })
  }, [])

  const zoomIn = useCallback(() => zoomBy(0.75), [zoomBy])
  const zoomOut = useCallback(() => zoomBy(-0.75), [zoomBy])

  const fitVisibleAssets = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || assets.length === 0) return
    const b = new maplibregl.LngLatBounds()
    for (const a of assets) b.extend([a.lng, a.lat])
    map.fitBounds(b, { padding: 100, duration: 900, maxZoom: 11 })
  }, [assets])

  useEffect(() => {
    if (!mapLoaded) return
    const map = mapRef.current?.getMap()
    if (!map || assets.length === 0) return

    if (skipFlyToAfterFit.current) {
      skipFlyToAfterFit.current = false
      return
    }

    const routeChanged = prevRouteScope.current !== routeScope
    prevRouteScope.current = routeScope

    if (routeChanged) {
      fitVisibleAssets()
      skipFlyToAfterFit.current = true
      return
    }

    map.flyTo({
      center: [selectedAsset.lng, selectedAsset.lat],
      zoom: Math.max(map.getZoom(), 9),
      duration: 650,
      essential: true,
    })
  }, [
    mapLoaded,
    routeScope,
    selectedAsset.id,
    selectedAsset.lng,
    selectedAsset.lat,
    assets,
    fitVisibleAssets,
  ])

  const onMapLoad = useCallback(
    (e: { target: maplibregl.Map }) => {
      registerAssetTypeIcons(e.target)
      setIconsReady(true)
      setMapLoaded(true)
      skipFlyToAfterFit.current = true
      fitVisibleAssets()
      prevRouteScope.current = routeScope
    },
    [fitVisibleAssets, routeScope],
  )

  const panelClass =
    'rounded-lg border border-neutral-200/70 bg-white/95 px-2.5 py-2 text-neutral-800 shadow-sm backdrop-blur-sm'

  return (
    <Card className="relative flex min-h-[460px] flex-1 overflow-hidden border border-neutral-200/70 bg-neutral-50 shadow-none">
      <div
        className={cn(
          'relative h-[460px] w-full overflow-hidden rounded-lg',
          '[&_.maplibregl-ctrl-bottom-right]:z-[20]',
          '[&_.maplibregl-ctrl-group]:shadow-sm',
        )}
      >
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          mapStyle={MINIMAL_MAP_STYLE}
          initialViewState={{
            longitude: DEFAULT_MAP_VIEW.longitude,
            latitude: DEFAULT_MAP_VIEW.latitude,
            zoom: DEFAULT_MAP_VIEW.zoom,
            pitch: 0,
            bearing: 0,
          }}
          maxPitch={60}
          dragRotate
          touchPitch
          scrollZoom
          doubleClickZoom
          boxZoom
          keyboard
          style={{ width: '100%', height: '100%' }}
          interactiveLayerIds={['asset-symbols']}
          onLoad={onMapLoad}
          onClick={onMapClick}
          onMouseMove={onMapMouseMove}
        >
          <ScaleControl
            position="bottom-right"
            unit="metric"
            style={{ marginBottom: '5.25rem', marginRight: '0.75rem' }}
          />

          {assets.length > 1 ? (
            <Source id="route-lines" type="geojson" data={linesGeoJson}>
              <Layer
                id="route-line-layer"
                type="line"
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
                paint={{
                  'line-color': ['get', 'lineColor'],
                  'line-width': 3,
                  'line-opacity': 0.92,
                  'line-dasharray': [0.4, 2.2],
                }}
              />
            </Source>
          ) : null}

          {assets.length > 0 && iconsReady ? (
            <Source id="asset-points" type="geojson" data={pointsGeoJson} promoteId="id">
              <Layer
                id="asset-symbols"
                type="symbol"
                layout={{
                  'icon-image': ['get', 'iconId'],
                  'icon-size': ['case', ['==', ['get', 'selected'], 1], 1.15, 0.78],
                  'icon-allow-overlap': true,
                  'icon-ignore-placement': true,
                  'icon-anchor': 'center',
                }}
                paint={{
                  'icon-opacity': 1,
                }}
              />
            </Source>
          ) : null}
        </Map>

        <div className="absolute bottom-10 right-3 z-[60] flex flex-col overflow-hidden rounded-lg border border-neutral-200/90 bg-white shadow-md">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={zoomIn}
            className="flex h-9 w-9 items-center justify-center text-neutral-700 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="mx-auto block h-px w-6 bg-neutral-200" aria-hidden />
          <button
            type="button"
            aria-label="Zoom out"
            onClick={zoomOut}
            className="flex h-9 w-9 items-center justify-center text-neutral-700 transition-colors hover:bg-neutral-100 active:bg-neutral-200"
          >
            <Minus className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-2 p-2 sm:p-3">
          <div className="flex min-h-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-3">
            <div
              className={cn(
                panelClass,
                'pointer-events-auto max-h-[min(52vh,240px)] max-w-full overflow-hidden lg:max-w-[220px]',
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                Map legend
              </p>
              <div className="mt-2 max-h-[200px] overflow-y-auto pr-1">
                <p className="text-[10px] font-semibold text-neutral-700">Asset types</p>
                <ul className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
                  {Object.entries(ASSET_TYPE_COLORS).map(([label, color]) => (
                    <li key={label} className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-700">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={label}
                      />
                      <span className="leading-tight">{label}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] font-semibold text-neutral-700">Feeder routes</p>
                <ul className="mt-1 space-y-0.5">
                  {ROUTE_DEFINITIONS.map((r) => (
                    <li
                      key={r.id}
                      className="flex min-w-0 items-center gap-1.5 text-[9px] font-medium text-neutral-800"
                    >
                      <span
                        className="inline-block h-0 w-5 shrink-0 border-t-2 border-dotted"
                        style={{ borderTopColor: ROUTE_LINE_COLORS[r.id] }}
                      />
                      <span className="truncate leading-tight" title={r.label}>
                        {r.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              className={cn(
                panelClass,
                'pointer-events-auto w-full max-w-full lg:ml-auto lg:max-w-[280px] lg:shrink-0',
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
                Selection
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold tracking-tight text-neutral-900">
                {selectedAsset.name}
              </p>
              <p className="truncate text-[11px] font-medium text-neutral-700">
                {selectedAsset.assetType} · {selectedAsset.route}
              </p>
              <div className="mt-2 space-y-1.5">
                <div>
                  <div className="mb-0.5 flex justify-between text-[11px] font-semibold text-neutral-700">
                    <span>Health</span>
                    <span className="tabular-nums">{selectedAsset.health}%</span>
                  </div>
                  <Progress value={selectedAsset.health}>
                    <ProgressTrack className="h-1">
                      <ProgressIndicator className="bg-emerald-600/90 transition-all duration-700" />
                    </ProgressTrack>
                  </Progress>
                </div>
                <div>
                  <div className="mb-0.5 flex justify-between text-[11px] font-semibold text-neutral-700">
                    <span>Security</span>
                    <span className="tabular-nums">{selectedAsset.security}%</span>
                  </div>
                  <Progress value={selectedAsset.security}>
                    <ProgressTrack className="h-1">
                      <ProgressIndicator className="bg-sky-600/85 transition-all duration-700" />
                    </ProgressTrack>
                  </Progress>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'border text-[10px] font-semibold capitalize',
                    statusBadgeClass(selectedAsset.status),
                  )}
                >
                  {selectedAsset.status}
                </Badge>
                <span className="text-[11px] font-medium text-neutral-700">{selectedAsset.lastSeen}</span>
              </div>
            </div>
          </div>

          <div className="pointer-events-none mt-auto flex flex-1 flex-col items-start justify-end pb-14 sm:pb-3">
            <div
              className={cn(
                panelClass,
                'pointer-events-auto flex max-w-[min(100%,340px)] divide-x divide-neutral-200/90 overflow-hidden px-0 py-0',
              )}
            >
              {[
                {
                  label: 'Healthy',
                  value: healthy,
                  labelClass: 'text-emerald-900',
                  valueClass: 'text-emerald-950',
                  segmentClass: 'bg-emerald-50/90',
                },
                {
                  label: 'Warning',
                  value: warning,
                  labelClass: 'text-amber-950',
                  valueClass: 'text-amber-950',
                  segmentClass: 'bg-amber-50/90',
                },
                {
                  label: 'Critical',
                  value: critical,
                  labelClass: 'text-rose-950',
                  valueClass: 'text-rose-950',
                  segmentClass: 'bg-rose-50/90',
                },
              ].map((b) => (
                <div
                  key={b.label}
                  className={cn(
                    'flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-2 text-center sm:px-3',
                    b.segmentClass,
                  )}
                >
                  <p className={cn('text-[9px] font-semibold uppercase tracking-wider', b.labelClass)}>
                    {b.label}
                  </p>
                  <p className={cn('text-base font-semibold tabular-nums leading-tight', b.valueClass)}>
                    {b.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
