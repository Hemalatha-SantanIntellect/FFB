import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'
import type { StyleSpecification } from 'maplibre-gl'
import { 
  Minus, 
  Plus, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Layers, 
  Flag,
  History,
  ShieldCheck,
  X, 
  LocateFixed, 
  ChevronRight, 
  ChevronDown,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Layer, ScaleControl, Source } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEvents } from '@/context/EventsContext'
import { cn } from '@/lib/utils'
import {
  AssetLegendIcon,
  MAP_ASSET_CATEGORIES,
  MAP_ASSET_PALETTE,
  drawFundingIconImageData,
  lineVisualForFeature,
  mapLegendLabel,
} from '@/lib/mapVisuals'

import fundingData from '@/data/fin_funding.json'

const IMAGERY_HYBRID_STYLE: StyleSpecification = {
  version: 8,
  name: 'Satellite',
  sources: {
    esriImagery: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution:
        '© Esri, Maxar, Earthstar Geographics — <a href="https://www.esri.com/">Esri</a>',
    },
    esriLabels: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
    },
  },
  layers: [
    { id: 'imagery', type: 'raster', source: 'esriImagery' },
    { id: 'labels', type: 'raster', source: 'esriLabels' },
  ],
}

const MAP_STYLES = [
  { id: 'satellite', label: 'Satellite', url: IMAGERY_HYBRID_STYLE },
  { id: 'light', label: 'Light', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  { id: 'streets', label: 'Streets', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
]

const DEFAULT_2D_VIEW_STATE = {
  longitude: -104.445773400222,
  latitude: 32.8407536290268,
  zoom: 16.3,
}

const PRIORITY_COLORS: Record<string, string> = {
  '1': '#ef4444', // Red
  '2': '#f59e0b', // Amber
  '3': '#3b82f6', // Blue
}

type GeoMapPanel2Props = {
  mapMode: '2D' | '3D'
  onMapModeChange: (mode: '2D' | '3D') => void
}

export function GeoMapPanel2({ mapMode, onMapModeChange }: GeoMapPanel2Props) {
  const { openEvents, createEvents, resolveEvent } = useEvents()
  const navigate = useNavigate()
  const iconIdForCategory = useCallback(
    (category: string) => `icon-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    [],
  )
  const mapRef = useRef<MapRef>(null)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [iconsLoaded, setIconsLoaded] = useState(false)
  const [currentStyle, setCurrentStyle] = useState(MAP_STYLES[0].url)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(MAP_ASSET_CATEGORIES),
  )

  // Incident & Animation States
  const [incidents, setIncidents] = useState<Record<string, any>>({})
  const [pulseOpacity, setPulseOpacity] = useState(1)

  // 1. Fetch Incidents for Finley USA
  useEffect(() => {
    const fetchIncidents = async () => {
      const SN_INSTANCE = 'https://accelareincdemo7.service-now.com'
      const auth = btoa('gautham_api_interface:AccelareDemo7#')
      // Try this more robust query string
const query = 'company.nameLIKEFinley USA^correlation_idISNOTEMPTY^state!=7'; 
// state!=7 filters out closed incidents
      
      try {
        const response = await fetch(
          `${SN_INSTANCE}/api/now/table/incident?sysparm_query=${encodeURIComponent(query)}`,
          { headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' } }
        )
        const data = await response.json()
        console.log(data)
        const mapping: Record<string, any> = {}
        if (data.result) {
          data.result.forEach((inc: any) => {
            mapping[inc.correlation_id] = inc
          })
        }
        setIncidents(mapping)
      } catch (err) {
        console.error("SN Fetch Error:", err)
      }
    }
    fetchIncidents()
    const interval = setInterval(fetchIncidents, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  // 2. Pulse Animation Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseOpacity(prev => (prev === 1 ? 0.3 : 1))
    }, 800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setIsLegendCollapsed(Boolean(selectedAsset))
  }, [selectedAsset])

  const geoData = useMemo(() => {
    const points: any = { type: 'FeatureCollection', features: [] }
    const lines: any = { type: 'FeatureCollection', features: [] }
    
    Object.entries(fundingData).forEach(([category, items]: [string, any]) => {
      items.forEach((item: any) => {
        const incident = incidents[item.guid]
        const props = {
          ...item,
          category,
          iconId: iconIdForCategory(category),
          color: MAP_ASSET_PALETTE[category as keyof typeof MAP_ASSET_PALETTE] || '#64748b',
          hasIncident: !!incident,
          incidentPriority: incident?.priority || '3',
          incidentColor: PRIORITY_COLORS[incident?.priority] || '#3b82f6',
        }

        if (item.geometry.x && item.geometry.y) {
          points.features.push({ 
            type: 'Feature', 
            id: item.rid, 
            properties: props, 
            geometry: { type: 'Point', coordinates: [item.geometry.x, item.geometry.y] } 
          })
        } else if (item.geometry.paths) {
          const lineVisual = lineVisualForFeature(category, item)
          lines.features.push({ 
            type: 'Feature', 
            id: item.rid, 
            properties: {
              ...props,
              lineColor: lineVisual.color,
              lineDash: lineVisual.dash ?? null,
            }, 
            geometry: { type: 'LineString', coordinates: item.geometry.paths[0].map((p: any) => [p[0], p[1]]) } 
          })
        }
      })
    })
    return { points, lines }
  }, [iconIdForCategory, incidents])

  const mapFilter = useMemo(() => ['in', ['get', 'category'], ['literal', Array.from(visibleCategories)]], [visibleCategories])
  const legendDetails = useMemo(() => {
    const details: Record<string, string[]> = {}
    const dist = (fundingData as Record<string, any[]>)['Distribution Fiber'] ?? []
    const drop = (fundingData as Record<string, any[]>)['Drop Fiber'] ?? []

    const distLabels = Array.from(
      new Set(
        dist.map((item) => {
          const size = item.size ?? item.connectivity_logic?.size
          const placement = String(item.placement ?? item.connectivity_logic?.placement ?? '').trim().toUpperCase() || 'N/A'
          return size ? `${size}, ${placement}` : placement
        }),
      ),
    )
    if (distLabels.length > 0) details['Distribution Fiber'] = distLabels

    const dropLabels = Array.from(
      new Set(
        drop.map((item) => String(item.placement ?? item.connectivity_logic?.placement ?? '').trim().toUpperCase() || 'N/A'),
      ),
    )
    if (dropLabels.length > 0) details['Drop Fiber'] = dropLabels

    return details
  }, [])

  const registerIcons = useCallback((map: maplibregl.Map) => {
    Object.entries(MAP_ASSET_PALETTE).forEach(([type, color]) => {
      const imgData = drawFundingIconImageData(type, color)
      const iconId = iconIdForCategory(type)
      if (!map.hasImage(iconId)) map.addImage(iconId, imgData, { pixelRatio: 2 })
    })
    if (!map.hasImage('event-warning-flag')) {
      const warningImg = drawFundingIconImageData('Event Warning', '#ef4444')
      map.addImage('event-warning-flag', warningImg, { pixelRatio: 2 })
    }
    setIconsLoaded(true)
  }, [iconIdForCategory])

  const onMapLoad = useCallback((e: any) => {
    registerIcons(e.target)
  }, [registerIcons])

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

    geoData.points.features.forEach((f: any) => {
      if (!visibleCategories.has(f.properties.category)) return
      lngs.push(f.geometry.coordinates[0]); lats.push(f.geometry.coordinates[1])
    })

    if (lngs.length === 0) return
    const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)]
    const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)]
    map.fitBounds([sw, ne], { padding: 70, duration: 900 })
  }, [geoData, visibleCategories])

  const openEventFeatures = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: openEvents.map((event) => ({
        type: 'Feature',
        id: event.id,
        properties: {
          id: event.id,
          assetRid: event.assetRid,
        },
        geometry: {
          type: 'Point',
          coordinates: [event.longitude, event.latitude],
        },
      })),
    }),
    [openEvents],
  )

  const eventCandidates = useMemo(
    () =>
      geoData.points.features
        .filter((feature: any) => visibleCategories.has(feature.properties.category))
        .map((feature: any) => ({
          assetRid: String(feature.properties.rid ?? feature.properties.guid ?? feature.id),
          assetName: String(feature.properties.name_as ?? feature.properties.rid ?? 'Asset'),
          category: String(feature.properties.category ?? 'Unknown'),
          longitude: Number(feature.geometry.coordinates[0]),
          latitude: Number(feature.geometry.coordinates[1]),
        })),
    [geoData.points.features, visibleCategories],
  )

  function createRandomEvents() {
    if (eventCandidates.length === 0) return
    const shuffled = [...eventCandidates].sort(() => Math.random() - 0.5)
    const count = Math.min(5, eventCandidates.length)
    createEvents(shuffled.slice(0, count))
  }

  function resolveAllOpenEvents() {
    if (openEvents.length === 0) return
    const ids = openEvents.map((event) => event.id)
    ids.forEach((id) => resolveEvent(id))
  }

  return (
    <Card className="fc-panel fc-map-2d relative flex min-h-[580px] flex-1 overflow-hidden bg-slate-50/60">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={currentStyle}
        initialViewState={DEFAULT_2D_VIEW_STATE}
        onLoad={onMapLoad}
        onStyleData={(e) => registerIcons(e.target)}
        onClick={(e) => {
          const feature = e.features?.[0];
          if (feature) {
            setSelectedAsset({
              ...feature.properties,
              sn_incident: incidents[feature.properties.guid]
            });
          } else {
            setSelectedAsset(null);
          }
        }}
        interactiveLayerIds={['funding-points', 'funding-lines', 'incident-glow', 'event-warnings']}
        style={{ width: '100%', height: '100%' }}
      >
        <Source id="lines-src" type="geojson" data={geoData.lines}>
          <Layer
            id="funding-lines"
            type="line"
            filter={mapFilter as any}
            paint={{ 'line-color': ['get', 'lineColor'], 'line-width': 3.5, 'line-opacity': 0.85 }}
            layout={{
              'line-join': 'round',
              'line-cap': 'round',
            }}
          />
        </Source>

        {iconsLoaded && (
          <Source id="points-src" type="geojson" data={geoData.points}>
            {/* Blinking Glow Layer */}
            <Layer 
              id="incident-glow" 
              type="circle" 
              filter={['all', mapFilter as any, ['==', ['get', 'hasIncident'], true]]}
              paint={{
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 8, 16, 22],
                'circle-color': ['get', 'incidentColor'],
                'circle-blur': 0.8,
                'circle-opacity': pulseOpacity * 0.7
              }}
            />
            <Layer 
              id="funding-points" 
              type="symbol" 
              filter={mapFilter as any} 
              layout={{
                'icon-image': ['get', 'iconId'],
                'icon-size': [
                  'case',
                  [
                    'any',
                    ['==', ['get', 'category'], 'Drop Splice'],
                    ['==', ['get', 'category'], 'Distribution Splice'],
                  ],
                  1.1,
                  ['any', ['==', ['get', 'category'], 'Distribution Fiber'], ['==', ['get', 'category'], 'Drop Fiber']],
                  0.55,
                  1.1,
                ],
                'icon-allow-overlap': true,
              }} 
            />
          </Source>
        )}
        <Source id="events-src" type="geojson" data={openEventFeatures as any}>
          <Layer
            id="event-warnings"
            type="symbol"
            layout={{
              'icon-image': 'event-warning-flag',
              'icon-size': 0.95,
              'icon-allow-overlap': true,
            }}
          />
        </Source>
        <ScaleControl position="top-right" />
      </Map>

      {/* Legend / Filters */}
      <div className={cn('absolute left-3 top-3 z-10 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md w-[220px]', isLegendCollapsed && 'w-[132px]')}>
        <div className={cn('flex items-center justify-between', !isLegendCollapsed && 'mb-3 border-b pb-2')}>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Legends</h4>
          <button onClick={() => setIsLegendCollapsed(!isLegendCollapsed)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
            {isLegendCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
        {!isLegendCollapsed && (
          <div className="space-y-0.5">
            <div className="mb-2 flex justify-between">
              <button onClick={() => setVisibleCategories(new Set())} className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase"><EyeOff className="h-2.5 w-2.5" /> Hide</button>
              <button onClick={() => setVisibleCategories(new Set(MAP_ASSET_CATEGORIES))} className="flex items-center gap-1 text-[9px] font-bold text-sky-600 uppercase"><RotateCcw className="h-2.5 w-2.5" /> Reset</button>
            </div>
            {Object.entries(MAP_ASSET_PALETTE).map(([type, color]) => (
              <button key={type} onClick={() => toggleCategory(type)} className={cn('flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-all', visibleCategories.has(type) ? 'opacity-100' : 'opacity-30 grayscale')}>
                <div className="flex items-center gap-2.5">
                  <AssetLegendIcon category={type} color={color} className="h-4 w-4" />
                  <div className="text-left">
                    <span className="block text-[10px] font-semibold text-slate-700">{mapLegendLabel(type)}</span>
                    {legendDetails[type]?.length ? (
                      <span className="block text-[8px] font-medium uppercase tracking-wide text-slate-400">
                        {legendDetails[type].join(' | ')}
                      </span>
                    ) : null}
                  </div>
                </div>
                {visibleCategories.has(type) ? <Eye className="h-3 w-3 text-slate-400" /> : <EyeOff className="h-3 w-3 text-slate-300" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Control Cluster */}
      <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4 flex gap-2">
        <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur-md">
          <button onClick={() => onMapModeChange('2D')} className={cn('rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase', mapMode === '2D' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>2D</button>
          <button onClick={() => onMapModeChange('3D')} className={cn('rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase', mapMode === '3D' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>3D</button>
        </div>
      </div>

      <div className="absolute bottom-6 right-3 z-10 flex flex-col items-end gap-2">
        {showStyleMenu && (
          <div className="mb-1 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-right-2">
            {MAP_STYLES.map((style) => (
              <button key={style.id} onClick={() => { setCurrentStyle(style.url); setShowStyleMenu(false); }} className={cn("w-full rounded-md px-3 py-2 text-left text-[11px] font-semibold", currentStyle === style.url ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-100")}>
                {style.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={fitToAssets} className="fc-control-btn bg-white shadow-md rounded-lg p-2 border border-slate-200"><LocateFixed className="h-4.5 w-4.5" /></button>
        <button
          onClick={createRandomEvents}
          className="fc-control-btn bg-white shadow-md rounded-lg p-2 border border-slate-200"
          title="Create Event"
        >
          <Flag className="h-5 w-5 text-rose-600" />
        </button>
        <button
          onClick={resolveAllOpenEvents}
          className="fc-control-btn bg-white shadow-md rounded-lg p-2 border border-slate-200"
          title="Fix Event"
        >
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        </button>
        <button
          onClick={() => navigate('/events-history')}
          className="fc-control-btn bg-white shadow-md rounded-lg p-2 border border-slate-200"
          title="Events History"
        >
          <History className="h-5 w-5 text-slate-700" />
        </button>
        <button onClick={() => setShowStyleMenu(!showStyleMenu)} className="fc-control-btn bg-white shadow-md rounded-lg p-2 border border-slate-200"><Layers className="h-5 w-5" /></button>
        <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-md">
          <button onClick={() => mapRef.current?.getMap().zoomIn()} className="border-b p-2.5 hover:bg-slate-100"><Plus className="h-4 w-4" /></button>
          <button onClick={() => mapRef.current?.getMap().zoomOut()} className="p-2.5 hover:bg-slate-100"><Minus className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Asset & Incident Details */}
      {selectedAsset && (
        <div className="animate-in fade-in slide-in-from-bottom-4 absolute bottom-4 left-3 z-20 w-[calc(100%-1.5rem)] max-w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-6 sm:left-6">
          <div className="mb-3 flex items-start justify-between">
            <div className="space-y-1">
              <Badge variant="secondary" className="text-[10px] font-bold uppercase">{selectedAsset.category?.replace(/_/g, ' ')}</Badge>
              <div className="text-[10px] font-mono text-slate-400">{selectedAsset.rid}</div>
            </div>
            <button onClick={() => setSelectedAsset(null)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>

          <h3 className="text-base font-bold text-slate-900">{selectedAsset.name_as || 'Unnamed Asset'}</h3>
          
          <div className="mt-4 space-y-2 border-t pt-3">
            {selectedAsset.sn_incident ? (
              <div className="mb-3 rounded-lg border border-red-100 bg-red-50 p-3 ring-1 ring-red-200">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-700 uppercase">
                    <AlertTriangle className="h-3 w-3" /> {selectedAsset.sn_incident.number}
                  </div>
                  <Badge className={cn("text-[8px] h-4", selectedAsset.sn_incident.priority === '1' ? "bg-red-600" : "bg-orange-500")}>
                    P{selectedAsset.sn_incident.priority}
                  </Badge>
                </div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">{selectedAsset.sn_incident.short_description}</p>
                <a 
                  href={`https://accelareincdemo7.service-now.com/nav_to.do?uri=incident.do?sys_id=${selectedAsset.sn_incident.sys_id}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-[9px] font-bold text-red-700 hover:underline"
                >
                  Open ServiceNow <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            ) : (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Device Health:</span>
                <span className="font-bold text-emerald-600 uppercase">Operational</span>
              </div>
            )}
            <div className="flex justify-between text-xs"><span className="text-slate-500">Lifecycle:</span><span className="font-semibold">{selectedAsset.lifecycle_state}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Exchange:</span><span className="font-semibold">{selectedAsset.exchange || 'Truax'}</span></div>
          </div>
        </div>
      )}
      {/*
      <EventFixModal
        open={isFixModalOpen}
        events={openEvents}
        sessionTotal={fixSessionTotal}
        resolvedCount={resolvedInSession}
        onResolveCurrent={resolveCurrentEvent}
        onClose={() => setIsFixModalOpen(false)}
      />
      */}
    </Card>
  )
}