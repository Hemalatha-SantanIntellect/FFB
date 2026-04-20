import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'
import { Minus, Plus, Info, Eye, EyeOff, RotateCcw, Layers, X, LocateFixed, ChevronRight, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Layer, ScaleControl, Source } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  AssetLegendIcon,
  MAP_ASSET_CATEGORIES,
  MAP_ASSET_PALETTE,
  drawFundingIconImageData,
  mapLegendLabel,
} from '@/lib/mapVisuals'

import fundingData from '@/data/fin_funding.json'

const MAP_STYLES = [
  { id: 'light', label: 'Light', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  { id: 'streets', label: 'Streets', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
]

type GeoMapPanel2Props = {
  mapMode: '2D' | '3D'
  onMapModeChange: (mode: '2D' | '3D') => void
}

export function GeoMapPanel2({ mapMode, onMapModeChange }: GeoMapPanel2Props) {
  const mapRef = useRef<MapRef>(null)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [iconsLoaded, setIconsLoaded] = useState(false)
  const [currentStyle, setCurrentStyle] = useState(MAP_STYLES[0].url)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(MAP_ASSET_CATEGORIES),
  )

  useEffect(() => {
    setIsLegendCollapsed(Boolean(selectedAsset))
  }, [selectedAsset])

  const geoData = useMemo(() => {
    const points: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
    const lines: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
    Object.entries(fundingData).forEach(([category, items]: [string, any]) => {
      items.forEach((item: any) => {
        const props = {
          ...item,
          category,
          iconId: `icon-${category}`,
          color: MAP_ASSET_PALETTE[category as keyof typeof MAP_ASSET_PALETTE] || '#64748b',
        }
        if (item.geometry.x && item.geometry.y) {
          points.features.push({ type: 'Feature', id: item.rid, properties: props, geometry: { type: 'Point', coordinates: [item.geometry.x, item.geometry.y] } })
        } else if (item.geometry.paths) {
          lines.features.push({ type: 'Feature', id: item.rid, properties: props, geometry: { type: 'LineString', coordinates: item.geometry.paths[0].map((p: any) => [p[0], p[1]]) } })
        }
      })
    })
    return { points, lines }
  }, [])

  const mapFilter = useMemo(() => ['in', ['get', 'category'], ['literal', Array.from(visibleCategories)]], [visibleCategories])

  const registerIcons = useCallback((map: maplibregl.Map) => {
    Object.entries(MAP_ASSET_PALETTE).forEach(([type, color]) => {
      const imgData = drawFundingIconImageData(type, color)
      if (!map.hasImage(`icon-${type}`)) map.addImage(`icon-${type}`, imgData, { pixelRatio: 2 })
    })
    setIconsLoaded(true)
  }, [])

  const onMapLoad = useCallback((e: any) => {
    registerIcons(e.target)
  }, [registerIcons])

  // Toggle Category Filter
  const toggleCategory = (category: string) => {
    const next = new Set(visibleCategories)
    if (next.has(category)) {
      next.delete(category)
      if (selectedAsset?.category === category) setSelectedAsset(null)
    } else {
      next.add(category)
    }
    setVisibleCategories(next)
  }

  const fitToAssets = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    const lngs: number[] = []
    const lats: number[] = []

    geoData.points.features.forEach((feature) => {
      const category = feature.properties?.category as string | undefined
      if (!category || !visibleCategories.has(category)) return
      const coords = feature.geometry.type === 'Point' ? feature.geometry.coordinates : null
      if (!coords) return
      lngs.push(coords[0] as number)
      lats.push(coords[1] as number)
    })

    geoData.lines.features.forEach((feature) => {
      const category = feature.properties?.category as string | undefined
      if (!category || !visibleCategories.has(category)) return
      if (feature.geometry.type !== 'LineString') return
      feature.geometry.coordinates.forEach((point) => {
        lngs.push(point[0] as number)
        lats.push(point[1] as number)
      })
    })

    if (lngs.length === 0 || lats.length === 0) return

    const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)]
    const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)]
    map.fitBounds([sw, ne], { padding: 70, duration: 900, maxZoom: 17.5 })
  }, [geoData.lines.features, geoData.points.features, visibleCategories])

  return (
    <Card className="fc-panel fc-map-2d relative flex min-h-[580px] flex-1 overflow-hidden bg-slate-50/60">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={currentStyle}
        initialViewState={{ longitude: -91.422, latitude: 44.792, zoom: 14.5 }}
        onLoad={onMapLoad}
        onStyleData={(e) => registerIcons(e.target)}
        onClick={(e) => setSelectedAsset(e.features?.[0]?.properties || null)}
        interactiveLayerIds={['funding-points', 'funding-lines']}
        style={{ width: '100%', height: '100%' }}
      >
        <Source id="lines-src" type="geojson" data={geoData.lines}>
          <Layer id="funding-lines" type="line" filter={mapFilter as any} paint={{ 'line-color': ['get', 'color'], 'line-width': 3.5, 'line-opacity': 0.8 }} />
        </Source>
        {iconsLoaded && (
          <Source id="points-src" type="geojson" data={geoData.points}>
            <Layer id="funding-points" type="symbol" filter={mapFilter as any} layout={{ 'icon-image': ['get', 'iconId'], 'icon-size': 0.55, 'icon-allow-overlap': true }} />
          </Source>
        )}
        <ScaleControl position="top-right" />
      </Map>

      {/* Legend / Filters */}
      <div
        className={cn(
          'absolute left-3 top-3 z-10 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:left-4 sm:top-4',
          isLegendCollapsed ? 'w-[132px]' : 'w-[220px]',
        )}
      >
        <div className={cn('flex items-center justify-between', !isLegendCollapsed && 'mb-3 border-b pb-2')}>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Map legend</h4>
          <button
            type="button"
            onClick={() => setIsLegendCollapsed((v) => !v)}
            className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title={isLegendCollapsed ? 'Expand legend' : 'Collapse legend'}
          >
            {isLegendCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {!isLegendCollapsed && (
          <>
            <div className="mb-2.5 flex items-center justify-between">
              <button
                onClick={() => setVisibleCategories(new Set())}
                className="flex cursor-pointer items-center gap-1 text-[9px] font-semibold text-slate-500 hover:text-slate-700"
              >
                <EyeOff className="h-2.5 w-2.5" /> Hide All
              </button>
              <button
                onClick={() => setVisibleCategories(new Set(MAP_ASSET_CATEGORIES))}
                className="flex cursor-pointer items-center gap-1 text-[9px] font-semibold text-sky-700 hover:text-sky-800"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Reset
              </button>
            </div>

            <div className="space-y-0.5">
              {Object.entries(MAP_ASSET_PALETTE).map(([type, color]) => {
                const isActive = visibleCategories.has(type)
                return (
                  <button
                    key={type}
                    onClick={() => toggleCategory(type)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition-all',
                      isActive ? 'bg-transparent hover:bg-slate-100' : 'bg-slate-50 opacity-40 grayscale',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <AssetLegendIcon category={type} color={color} className="h-4 w-4" />
                      <span className="text-[10px] font-semibold text-slate-700">{mapLegendLabel(type)}</span>
                    </div>
                    {isActive ? <Eye className="h-3 w-3 text-slate-400" /> : <EyeOff className="h-3 w-3 text-slate-300" />}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
        <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur-md">
          <button
            type="button"
            onClick={() => onMapModeChange('2D')}
            className={cn(
              'rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
              mapMode === '2D'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            2D
          </button>
          <button
            type="button"
            onClick={() => onMapModeChange('3D')}
            className={cn(
              'rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
              mapMode === '3D'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            3D
          </button>
        </div>
      </div>

      {/* Control Cluster (Bottom Right) */}
      <div className="absolute bottom-6 right-3 z-10 flex flex-col items-end gap-2 sm:bottom-10 sm:right-4">
        {showStyleMenu && (
          <div className="mb-1 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-right-2">
            {MAP_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  setCurrentStyle(style.url)
                  setShowStyleMenu(false)
                }}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-[11px] font-semibold transition-colors",
                  currentStyle === style.url ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {style.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={fitToAssets}
            className="fc-control-btn"
            title="Recenter to visible assets"
          >
            <LocateFixed className="h-4.5 w-4.5" />
          </button>

          <button 
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className={cn(
              "fc-control-btn",
              showStyleMenu ? "border-sky-500 text-sky-700" : ""
            )}
          >
            <Layers className="h-5 w-5" />
          </button>

          <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
            <button onClick={() => mapRef.current?.getMap().zoomIn()} className="border-b p-2.5 hover:bg-slate-100">
              <Plus className="h-4 w-4 text-slate-600" />
            </button>
            <button onClick={() => mapRef.current?.getMap().zoomOut()} className="p-2.5 hover:bg-slate-100">
              <Minus className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Asset Details (Visible on Click) */}
      {selectedAsset && (
        <div className="animate-in fade-in slide-in-from-bottom-4 absolute bottom-4 left-3 z-20 w-[calc(100%-1.5rem)] max-w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-6 sm:left-6 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase">
                {String(selectedAsset.category ?? '').trim().replace(/_/g, ' ')}
              </Badge>
              <span className="block truncate text-[10px] font-mono text-slate-400">{selectedAsset.rid}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAsset(null)}
              className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title="Close details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{selectedAsset.name_as || 'Unnamed Asset'}</h3>
          <div className="mt-4 space-y-2 border-t pt-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold uppercase tracking-tighter text-emerald-600">{selectedAsset.lifecycle_state}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Exchange:</span>
              <span className="font-semibold">{selectedAsset.exchange || 'Truax'}</span>
            </div>
            {selectedAsset.sensor_metadata && (
              <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/60 p-2.5">
                <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase text-sky-700">
                  <Info className="h-2.5 w-2.5" /> Sensor Node
                </p>
                <p className="text-[11px] font-medium text-sky-900">
                  {typeof selectedAsset.sensor_metadata === 'string' 
                    ? JSON.parse(selectedAsset.sensor_metadata).sensor_name 
                    : selectedAsset.sensor_metadata.sensor_name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}