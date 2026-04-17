import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'
import { Minus, Plus, Eye, EyeOff, RotateCcw, Layers, X, Box } from 'lucide-react'
import { useMemo, useState } from 'react'
import Map from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { IconLayer, PathLayer } from '@deck.gl/layers'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import fundingData from '@/data/fin_funding.json'

const MAP_STYLES = [
  { id: 'dark', label: 'Dark 3D', url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
  { id: 'light', label: 'Light 3D', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  { id: 'streets', label: 'Satellite/Streets', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
]

const ASSET_COLORS: Record<string, [number, number, number]> = {
  AERIAL_LOOP_COIL: [239, 68, 68], 
  ANCHOR: [245, 158, 11],           
  CONDUIT: [16, 185, 129],          
  EQUIPMENT: [59, 130, 246],        
  FIBER_DIST: [139, 92, 246],       
  FIBER_DROP: [236, 72, 153],       
  HANDHOLE: [99, 102, 241],         
  PEDESTAL: [20, 184, 166],         
  POLE: [113, 113, 122],             
  SPLICE_CASE: [249, 115, 22],      
}

// Function to generate the Icon Atlas (canvas) for Deck.gl
// This creates a single sprite sheet for performance
function createIconAtlas(colors: typeof ASSET_COLORS) {
  const size = 64
  const canvas = document.createElement('canvas')
  const keys = Object.keys(colors)
  canvas.width = size * keys.length
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  keys.forEach((type, i) => {
    const cx = size * i + size / 2
    const cy = size / 2
    const rgb = colors[type]
    ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 3

    // Simplified 3D-feeling geometric primitives for the atlas
    ctx.beginPath()
    if (type === 'POLE') ctx.rect(cx - 5, 5, 10, 54)
    else if (type === 'HANDHOLE') ctx.ellipse(cx, cy, 25, 15, 0, 0, Math.PI * 2)
    else ctx.arc(cx, cy, 22, 0, Math.PI * 2)
    
    ctx.fill()
    ctx.stroke()
  })
  return canvas
}

export function GeoMapPanel3D() {
  const [viewState, setViewState] = useState({
    longitude: -91.422,
    latitude: 44.792,
    zoom: 15,
    pitch: 45, // Critical for 3D view
    bearing: 0
  })

  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [currentStyle, setCurrentStyle] = useState(MAP_STYLES[2].url)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set(Object.keys(ASSET_COLORS)))

  const atlas = useMemo(() => createIconAtlas(ASSET_COLORS), [])

  const data = useMemo(() => {
    const points: any[] = []
    const paths: any[] = []

    Object.entries(fundingData).forEach(([category, items]: [string, any]) => {
      if (!visibleCategories.has(category)) return

      items.forEach((item: any) => {
        const common = { ...item, category, color: ASSET_COLORS[category] }
        
        if (item.geometry.x && item.geometry.y) {
          // Point with Z-elevation
          points.push({
            ...common,
            position: [item.geometry.x, item.geometry.y, item.geometry.z_elevation || 0]
          })
        } else if (item.geometry.paths) {
          // Path with 3D coordinates [lng, lat, z]
          paths.push({
            ...common,
            path: item.geometry.paths[0]
          })
        }
      })
    })
    return { points, paths }
  }, [visibleCategories])

  const layers = [
    new PathLayer({
      id: 'path-layer-3d',
      data: data.paths,
      pickable: true,
      widthScale: 1,
      widthMinPixels: 3,
      getPath: d => d.path,
      getColor: d => d.color,
      getWidth: 3,
      onClick: info => setSelectedAsset(info.object)
    }),
   new IconLayer({
      id: 'icon-layer-3d',
      data: data.points,
      // Cast the canvas to any to satisfy the complex IconLayerProps type
      iconAtlas: atlas as any, 
      iconMapping: Object.keys(ASSET_COLORS).reduce((acc, key, i) => ({
        ...acc, [key]: {x: i * 64, y: 0, width: 64, height: 64, mask: false}
      }), {}),
      getIcon: d => d.category,
      getPosition: d => d.position,
      getSize: 32,
      pickable: true,
      onClick: info => setSelectedAsset(info.object)
    })
  ]

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
    <Card className="relative flex min-h-[700px] flex-1 overflow-hidden border border-neutral-200/70 bg-neutral-900 shadow-none">
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        onViewStateChange={({viewState}) => setViewState(viewState as any)}
        getCursor={({isHovering}) => (isHovering ? 'pointer' : 'grab')}
      >
        <Map mapLib={maplibregl} mapStyle={currentStyle} />
      </DeckGL>

      {/* Floating Header Label */}
      <div className="absolute left-6 top-6 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 flex items-center gap-2">
          <Box className="h-4 w-4 text-blue-400" />
          <span className="text-white text-[11px] font-bold uppercase tracking-widest">3D Digital Twin View</span>
        </div>
      </div>

      {/* Asset Filters (Legend) */}
      <div className="absolute left-6 top-20 z-10 w-56 rounded-xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-md text-white">
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Asset Layers</h4>
          <button 
            onClick={() => setVisibleCategories(new Set(Object.keys(ASSET_COLORS)))}
            className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <RotateCcw className="h-2.5 w-2.5" /> Reset
          </button>
        </div>
        <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {Object.entries(ASSET_COLORS).map(([type, rgb]) => {
            const isActive = visibleCategories.has(type)
            return (
              <button
                key={type}
                onClick={() => toggleCategory(type)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-all",
                  isActive ? "bg-white/5 hover:bg-white/10" : "opacity-30 grayscale"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: `rgb(${rgb.join(',')})` }} />
                  <span className="text-[10px] font-bold">{type.replace(/_/g, ' ')}</span>
                </div>
                {isActive ? <Eye className="h-3 w-3 text-neutral-500" /> : <EyeOff className="h-3 w-3 text-neutral-700" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Control Cluster */}
      <div className="absolute bottom-10 right-6 z-10 flex flex-col gap-2 items-end">
        {showStyleMenu && (
          <div className="mb-1 w-36 rounded-lg border border-white/10 bg-black/90 p-1 shadow-2xl">
            {MAP_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => { setCurrentStyle(style.url); setShowStyleMenu(false); }}
                className={cn(
                  "w-full px-3 py-2 text-left text-[11px] font-bold rounded-md transition-colors",
                  currentStyle === style.url ? "bg-blue-600 text-white" : "text-neutral-400 hover:bg-white/5"
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
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/80 text-white shadow-lg hover:bg-neutral-800"
          >
            <Layers className="h-5 w-5" />
          </button>
          <div className="flex flex-col rounded-lg border border-white/10 bg-black/80 shadow-lg overflow-hidden">
            <button onClick={() => setViewState(v => ({...v, zoom: v.zoom + 1}))} className="p-2.5 hover:bg-white/5 border-b border-white/10 text-white">
              <Plus className="h-4 w-4" />
            </button>
            <button onClick={() => setViewState(v => ({...v, zoom: v.zoom - 1}))} className="p-2.5 hover:bg-white/5 text-white">
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Asset Detail Card */}
      {selectedAsset && (
        <div className="absolute bottom-10 left-6 z-20 w-80 animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-white/10 bg-black/90 p-5 shadow-2xl backdrop-blur-xl text-white">
          <button onClick={() => setSelectedAsset(null)} className="absolute right-3 top-3 p-1 text-neutral-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-[9px] uppercase font-bold tracking-widest">
              {selectedAsset.category}
            </Badge>
            <span className="text-[10px] font-mono text-neutral-500">{selectedAsset.rid}</span>
          </div>
          <h3 className="text-lg font-bold">{selectedAsset.name_as || 'Digital Twin Node'}</h3>
          
          <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">Elevation</span>
              <span className="text-xs font-mono font-bold text-blue-400">
                {selectedAsset.geometry?.z_elevation || selectedAsset.geometry?.paths?.[0]?.[0]?.[2] || 0}m
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-2 rounded-lg">
                <p className="text-[9px] text-neutral-500 font-bold uppercase">Lat</p>
                <p className="text-[11px] font-mono">{selectedAsset.geometry?.y || selectedAsset.geometry?.paths?.[0]?.[0]?.[1]}</p>
              </div>
              <div className="bg-white/5 p-2 rounded-lg">
                <p className="text-[9px] text-neutral-500 font-bold uppercase">Lng</p>
                <p className="text-[11px] font-mono">{selectedAsset.geometry?.x || selectedAsset.geometry?.paths?.[0]?.[0]?.[0]}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}