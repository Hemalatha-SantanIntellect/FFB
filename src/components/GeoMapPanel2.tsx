import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'
import { Minus, Plus, Info, Eye, EyeOff, RotateCcw, Layers, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import Map, { Layer, ScaleControl, Source } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import fundingData from '@/data/fin_funding.json'

const MAP_STYLES = [
  { id: 'light', label: 'Light', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  { id: 'dark', label: 'Dark', url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
//   { id: 'topo', label: 'Topographic', url: 'https://demotiles.maplibre.org/style.json' },
  { id: 'streets', label: 'Streets', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
]

const ASSET_COLORS: Record<string, string> = {
  AERIAL_LOOP_COIL: '#ef4444', 
  ANCHOR: '#f59e0b',           
  CONDUIT: '#10b981',          
  EQUIPMENT: '#3b82f6',        
  FIBER_DIST: '#8b5cf6',       
  FIBER_DROP: '#ec4899',       
  HANDHOLE: '#6366f1',         
  PEDESTAL: '#14b8a6',         
  POLE: '#71717a',             
  SPLICE_CASE: '#f97316',      
}

function drawFundingIcon(type: string, color: string): ImageData {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const cx = size / 2
  const cy = size / 2
  ctx.clearRect(0, 0, size, size)
  ctx.strokeStyle = '#0f172a'
  ctx.fillStyle = color
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  switch (type) {
    case 'POLE':
      ctx.fillRect(cx - 4, 10, 8, 44); ctx.fillRect(cx - 16, 15, 32, 6); ctx.strokeRect(cx - 4, 10, 8, 44); break
    case 'PEDESTAL':
      ctx.fillRect(cx - 15, cy - 20, 30, 40); ctx.strokeRect(cx - 15, cy - 20, 30, 40); break
    case 'HANDHOLE':
      ctx.beginPath(); ctx.ellipse(cx, cy, 22, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break
    case 'SPLICE_CASE':
      ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + 20, cy); ctx.lineTo(cx, cy + 20); ctx.lineTo(cx - 20, cy); ctx.closePath(); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill(); break
    case 'ANCHOR':
      ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 15, cy + 15); ctx.lineTo(cx - 15, cy + 15); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, 5); ctx.stroke(); break
    case 'AERIAL_LOOP_COIL':
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.stroke(); break
    case 'EQUIPMENT':
      ctx.fillRect(cx - 18, cy - 18, 36, 36); ctx.strokeRect(cx - 18, cy - 18, 36, 36); ctx.beginPath(); ctx.moveTo(cx - 18, cy - 18); ctx.lineTo(cx + 18, cy + 18); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + 18, cy - 18); ctx.lineTo(cx - 18, cy + 18); ctx.stroke(); break
    default:
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  }
  return ctx.getImageData(0, 0, size, size)
}

export function GeoMapPanel2() {
  const mapRef = useRef<MapRef>(null)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [iconsLoaded, setIconsLoaded] = useState(false)
  const [currentStyle, setCurrentStyle] = useState(MAP_STYLES[0].url)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set(Object.keys(ASSET_COLORS)))

  const geoData = useMemo(() => {
    const points: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
    const lines: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
    Object.entries(fundingData).forEach(([category, items]: [string, any]) => {
      items.forEach((item: any) => {
        const props = { ...item, category, iconId: `icon-${category}`, color: ASSET_COLORS[category] || '#94a3b8' }
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
    Object.entries(ASSET_COLORS).forEach(([type, color]) => {
      const imgData = drawFundingIcon(type, color)
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

  return (
    <Card className="relative flex min-h-[620px] flex-1 overflow-hidden border border-neutral-200/70 bg-neutral-50 shadow-none">
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
        <ScaleControl position="bottom-right" />
      </Map>

      {/* Legend / Filters */}
      <div className="absolute left-4 top-4 z-10 w-56 rounded-xl border border-neutral-200 bg-white/95 p-3 shadow-xl backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between border-b pb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Asset Filters</h4>
          <button 
            onClick={() => setVisibleCategories(new Set(Object.keys(ASSET_COLORS)))}
            className="flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:text-blue-800"
          >
            <RotateCcw className="h-2.5 w-2.5" /> Reset
          </button>
        </div>
        <div className="space-y-0.5">
          {Object.entries(ASSET_COLORS).map(([type, color]) => {
            const isActive = visibleCategories.has(type)
            return (
              <button
                key={type}
                onClick={() => toggleCategory(type)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-all",
                  isActive ? "bg-transparent hover:bg-neutral-100" : "bg-neutral-50 opacity-40 grayscale"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-bold text-neutral-700">{type.replace(/_/g, ' ')}</span>
                </div>
                {isActive ? <Eye className="h-3 w-3 text-neutral-400" /> : <EyeOff className="h-3 w-3 text-neutral-300" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Control Cluster (Bottom Right) */}
      <div className="absolute bottom-10 right-4 z-10 flex flex-col gap-2 items-end">
        {showStyleMenu && (
          <div className="mb-1 w-32 rounded-lg border border-neutral-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-right-2">
            {MAP_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  setCurrentStyle(style.url)
                  setShowStyleMenu(false)
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-[11px] font-bold rounded-md transition-colors",
                  currentStyle === style.url ? "bg-blue-50 text-blue-700" : "hover:bg-neutral-100 text-neutral-600"
                )}
              >
                {style.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border bg-white shadow-md transition-colors",
              showStyleMenu ? "border-blue-500 text-blue-600" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            )}
          >
            <Layers className="h-5 w-5" />
          </button>

          <div className="flex flex-col rounded-lg border border-neutral-200 bg-white shadow-md overflow-hidden">
            <button onClick={() => mapRef.current?.getMap().zoomIn()} className="p-2.5 hover:bg-neutral-100 border-b">
              <Plus className="h-4 w-4 text-neutral-600" />
            </button>
            <button onClick={() => mapRef.current?.getMap().zoomOut()} className="p-2.5 hover:bg-neutral-100">
              <Minus className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Asset Details (Visible on Click) */}
      {selectedAsset && (
        <div className="absolute bottom-6 left-6 z-20 w-80 animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl">
          <button 
            onClick={() => setSelectedAsset(null)}
            className="absolute right-3 top-3 p-1 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="text-[10px] uppercase font-bold">{selectedAsset.category}</Badge>
            <span className="text-[10px] font-mono text-neutral-400">{selectedAsset.rid}</span>
          </div>
          <h3 className="text-lg font-bold text-neutral-900">{selectedAsset.name_as || 'Unnamed Asset'}</h3>
          <div className="mt-4 space-y-2 border-t pt-3">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Status:</span>
              <span className="font-bold text-emerald-600 uppercase tracking-tighter">{selectedAsset.lifecycle_state}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Exchange:</span>
              <span className="font-semibold">{selectedAsset.exchange || 'Truax'}</span>
            </div>
            {selectedAsset.sensor_metadata && (
              <div className="mt-3 rounded-lg bg-blue-50/50 p-2.5 border border-blue-100">
                <p className="text-[9px] uppercase font-bold text-blue-600 mb-1 flex items-center gap-1">
                  <Info className="h-2.5 w-2.5" /> Sensor Node
                </p>
                <p className="text-[11px] font-medium text-blue-900">
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