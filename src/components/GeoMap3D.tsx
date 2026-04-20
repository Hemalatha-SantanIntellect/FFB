import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'
import {
  AmbientLight,
  DirectionalLight,
  LightingEffect,
  WebMercatorViewport,
} from '@deck.gl/core'
import { Minus, Plus, Eye, EyeOff, RotateCcw, Layers, X, Box, LocateFixed, ChevronRight, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import MapGL from 'react-map-gl/maplibre'
import { ScaleControl } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { IconLayer, PathLayer, ColumnLayer } from '@deck.gl/layers'
import type { Position } from '@deck.gl/core'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { fundingMatchesRouteFilter } from '@/lib/assetFilters'
import {
  AssetLegendIcon,
  MAP_ASSET_CATEGORIES,
  MAP_ASSET_RGB,
  drawFundingIconDataUrl,
  mapLegendLabel,
} from '@/lib/mapVisuals'

import fundingData from '@/data/fin_funding.json'

const FT_TO_M = 0.3048

const MAP_STYLES = [
  { id: 'light', label: 'Light 3D', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  { id: 'streets', label: 'Streets', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
]

const ASSET_COLORS: Record<string, [number, number, number]> = MAP_ASSET_RGB

const POINT_3D_STYLE: Record<string, { radius: number; height: number }> = {
  POLE: { radius: 0.32, height: 8.2 },
  AERIAL_LOOP_COIL: { radius: 0.44, height: 1.4 },
  ANCHOR: { radius: 0.28, height: 0.8 },
  EQUIPMENT: { radius: 0.56, height: 2.6 },
  HANDHOLE: { radius: 0.66, height: 0.7 },
  PEDESTAL: { radius: 0.48, height: 1.8 },
  SPLICE_CASE: { radius: 0.4, height: 1.1 },
}

function geometryBaseZ(geometry: { z_elevation?: number; z_depth_ft?: number }): number {
  if (geometry.z_elevation != null) return geometry.z_elevation
  if (geometry.z_depth_ft != null) return geometry.z_depth_ft * FT_TO_M
  return 0
}

function rgba(color: [number, number, number], alpha: number): [number, number, number, number] {
  return [...color, Math.round(alpha * 255)] as [number, number, number, number]
}

const lightingEffect = new LightingEffect({
  ambient: new AmbientLight({ color: [255, 255, 255], intensity: 0.48 }),
  sun: new DirectionalLight({
    color: [255, 252, 245],
    intensity: 1.25,
    direction: [0.7, -1.25, 0.95],
  }),
})

type GeoMapPanel3DProps = {
  selectedRoute: string
  mapMode: '2D' | '3D'
  onMapModeChange: (mode: '2D' | '3D') => void
}

type FundingPathRow = {
  path: Position[]
  category: string
  color: [number, number, number]
  [key: string]: unknown
}

type TwinViewState = {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
  maxPitch: number
  minZoom: number
  maxZoom: number
}

export function GeoMapPanel3D({ selectedRoute, mapMode, onMapModeChange }: GeoMapPanel3DProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 1200, height: 700 })
  const [viewState, setViewState] = useState<TwinViewState>({
    longitude: -91.422,
    latitude: 44.792,
    zoom: 15.2,
    pitch: 60,
    bearing: -26,
    maxPitch: 88,
    minZoom: 11.5,
    maxZoom: 20,
  })

  const [selectedAsset, setSelectedAsset] = useState<Record<string, unknown> | null>(null)
  const [currentStyle, setCurrentStyle] = useState(MAP_STYLES[0].url)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    () => new Set(MAP_ASSET_CATEGORIES),
  )

  const iconUrlByCategory = useMemo(() => {
    const urls: Record<string, string> = {}
    Object.entries(ASSET_COLORS).forEach(([category, rgb]) => {
      urls[category] = drawFundingIconDataUrl(category, `rgb(${rgb.join(',')})`)
    })
    return urls
  }, [])

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 40 && height > 40) setSize({ width, height })
    })
    ro.observe(el)
    const { width, height } = el.getBoundingClientRect()
    if (width > 40 && height > 40) setSize({ width, height })
    return () => ro.disconnect()
  }, [])

  const data = useMemo(() => {
    const points: Record<string, unknown>[] = []
    const paths: Record<string, unknown>[] = []

    Object.entries(fundingData as Record<string, Record<string, unknown>[]>).forEach(
      ([category, items]) => {
        if (!visibleCategories.has(category)) return

        items.forEach((item) => {
          if (!fundingMatchesRouteFilter(item, selectedRoute)) return

          const color = ASSET_COLORS[category] ?? [120, 120, 120]
          const common = { ...item, category, color }

          const geom = item.geometry as Record<string, unknown>
          if (geom?.x != null && geom?.y != null) {
            const z = geometryBaseZ(geom as { z_elevation?: number; z_depth_ft?: number })
            points.push({
              ...common,
              position: [geom.x, geom.y, z],
            })
          } else if (Array.isArray(geom?.paths)) {
            const path0 = (geom.paths as number[][][])[0]
            if (path0?.length) {
              const path: Position[] = path0.map((p) => {
                const z = p.length >= 3 ? (p[2] ?? 0) : 0
                return [p[0], p[1], z] as Position
              })
              paths.push({
                ...common,
                path,
              })
            }
          }
        })
      },
    )
    return { points, paths }
  }, [visibleCategories, selectedRoute])

  const fitToData = useCallback(() => {
    const lngs: number[] = []
    const lats: number[] = []

    for (const p of data.points) {
      const pos = p.position as number[]
      lngs.push(pos[0])
      lats.push(pos[1])
    }
    for (const row of data.paths) {
      for (const c of row.path as number[][]) {
        lngs.push(c[0])
        lats.push(c[1])
      }
    }

    if (lngs.length === 0) return

    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const cx = (minLng + maxLng) / 2
    const cy = (minLat + maxLat) / 2

    const vp = new WebMercatorViewport({
      width: size.width,
      height: size.height,
      longitude: cx,
      latitude: cy,
      zoom: 16,
      pitch: 0,
      bearing: 0,
    })
    const fitted = vp.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 72, maxZoom: 18.2 },
    )

    setViewState((v) => ({
      ...v,
      longitude: fitted.longitude,
      latitude: fitted.latitude,
      zoom: fitted.zoom,
      pitch: v.pitch,
      bearing: v.bearing,
    }))
  }, [data.paths, data.points, size.height, size.width])

  useEffect(() => {
    const id = requestAnimationFrame(() => fitToData())
    return () => cancelAnimationFrame(id)
  }, [selectedRoute, visibleCategories, fitToData])

  useEffect(() => {
    setIsLegendCollapsed(Boolean(selectedAsset))
  }, [selectedAsset])

  const selectedRid = (selectedAsset as { rid?: string } | null)?.rid

  const pointLayer = useMemo(
    () =>
      new IconLayer({
        id: 'point-icons-3d',
        data: data.points,
        pickable: true,
        billboard: true,
        sizeUnits: 'pixels',
        sizeScale: 1,
        getPosition: (d) => {
          const p = (d as { position: number[] }).position
          return [p[0], p[1], p[2] ?? 0] as Position
        },
        getIcon: (d) => {
          const category = (d as { category?: string }).category ?? 'POLE'
          return {
            url: iconUrlByCategory[category] ?? iconUrlByCategory.POLE,
            width: 64,
            height: 64,
            anchorY: 32,
          }
        },
        getSize: (d) => {
          const rid = (d as { rid?: string }).rid
          return rid && rid === selectedRid ? 32 : 24
        },
        onClick: (info) => {
          if (info.object) setSelectedAsset(info.object as Record<string, unknown>)
        },
        updateTriggers: {
          getIcon: [iconUrlByCategory],
          getSize: [selectedRid],
        },
      }),
    [data.points, iconUrlByCategory, selectedRid],
  )

  const pointDepthLayer = useMemo(
    () =>
      new ColumnLayer<Record<string, unknown>>({
        id: 'point-depth-columns-3d',
        data: data.points,
        pickable: false,
        extruded: true,
        stroked: true,
        filled: true,
        diskResolution: 18,
        radius: 0.42,
        radiusUnits: 'meters',
        lineWidthUnits: 'meters',
        getPosition: (d) => {
          const p = (d as { position: number[] }).position
          return [p[0], p[1], p[2] ?? 0] as Position
        },
        getElevation: (d) => {
          const category = (d as { category?: string }).category ?? 'POLE'
          return POINT_3D_STYLE[category]?.height ?? 1.4
        },
        getFillColor: (d) => {
          const category = (d as { category?: string }).category ?? 'POLE'
          const c = ASSET_COLORS[category] ?? [107, 114, 128]
          return rgba(c, 0.48)
        },
        getLineColor: [15, 23, 42, 110],
        getLineWidth: 0.06,
        material: {
          ambient: 0.22,
          diffuse: 0.74,
          shininess: 58,
          specularColor: [84, 96, 116],
        },
        updateTriggers: {
          getElevation: [POINT_3D_STYLE],
        },
      }),
    [data.points],
  )

  const pathLayer = useMemo(
    () =>
      new PathLayer<FundingPathRow>({
        id: 'path-layer-3d',
        data: data.paths as FundingPathRow[],
        pickable: true,
        billboard: false,
        capRounded: true,
        jointRounded: true,
        widthUnits: 'meters',
        widthScale: 1,
        widthMinPixels: 2,
        miterLimit: 4,
        getPath: (d) => d.path,
        getColor: (d) => {
          const c = d.color as [number, number, number]
          const alpha = d.category === 'CONDUIT' ? 0.78 : 0.92
          return rgba(c, alpha)
        },
        getWidth: (d) => {
          if (d.category === 'FIBER_DROP') return 0.3
          if (d.category === 'FIBER_DIST') return 0.42
          return 0.56
        },
        onClick: (info) => {
          if (info.object) setSelectedAsset(info.object as Record<string, unknown>)
        },
      }),
    [data.paths],
  )

  const layers = useMemo(() => [pathLayer, pointDepthLayer, pointLayer], [pathLayer, pointDepthLayer, pointLayer])

  const toggleCategory = (category: string) => {
    const next = new Set(visibleCategories)
    if (next.has(category)) {
      next.delete(category)
      if ((selectedAsset as { category?: string } | null)?.category === category) {
        setSelectedAsset(null)
      }
    } else {
      next.add(category)
    }
    setVisibleCategories(next)
  }

  return (
    <Card className="fc-panel relative flex min-h-[620px] flex-1 overflow-hidden bg-slate-100/60">
      <div ref={wrapRef} className="fc-map-3d absolute inset-0">
        <DeckGL
          width={size.width}
          height={size.height}
          viewState={viewState as any}
          controller={{ touchRotate: true, inertia: true }}
          layers={layers}
          effects={[lightingEffect]}
          onViewStateChange={({ viewState: vs }) => setViewState(vs as unknown as TwinViewState)}
          getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
        >
          <MapGL mapLib={maplibregl} mapStyle={currentStyle}>
            <ScaleControl position="top-right" />
          </MapGL>
        </DeckGL>
      </div>

      <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-6">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white/95 px-3 py-1.5 backdrop-blur-md">
          <Box className="h-4 w-4 text-sky-700" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-800">
            3D infrastructure twin
          </span>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-10 sm:right-6 sm:top-6">
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

      <div
        className={cn(
          'absolute left-3 top-16 z-10 rounded-xl border border-slate-200 bg-white/95 p-3 text-slate-900 shadow-xl backdrop-blur-md sm:left-6 sm:top-[4.5rem]',
          isLegendCollapsed ? 'w-[132px]' : 'w-[230px]',
        )}
      >
        <div className={cn('flex items-center justify-between', !isLegendCollapsed && 'mb-3 border-b border-slate-200 pb-2')}>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Map legend
          </h4>
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
            <div className="mb-2.5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setVisibleCategories(new Set(MAP_ASSET_CATEGORIES))}
                className="flex items-center gap-1 text-[9px] font-semibold text-sky-700 hover:text-sky-800"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Reset
              </button>
            </div>
            <div className="custom-scrollbar max-h-[380px] space-y-0.5 overflow-y-auto pr-1">
              {Object.entries(ASSET_COLORS).map(([type, rgb]) => {
                const isActive = visibleCategories.has(type)
                const color = `rgb(${rgb.join(',')})`
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleCategory(type)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-all',
                      isActive ? 'bg-slate-50 hover:bg-slate-100' : 'opacity-30 grayscale',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <AssetLegendIcon category={type} color={color} mode="2d" className="h-4 w-4" />
                      <span className="text-[10px] font-semibold">{mapLegendLabel(type)}</span>
                    </div>
                    {isActive ? (
                      <Eye className="h-3 w-3 text-slate-400" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-slate-300" />
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-6 right-3 z-10 flex flex-col items-end gap-2 sm:bottom-10 sm:right-6">
        {showStyleMenu && (
          <div className="mb-1 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-2xl">
            {MAP_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => {
                  setCurrentStyle(style.url)
                  setShowStyleMenu(false)
                }}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-[11px] font-semibold transition-colors',
                  currentStyle === style.url
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-100',
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
            onClick={fitToData}
            className="fc-control-btn"
            title="Recenter to visible assets"
          >
            <LocateFixed className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="fc-control-btn"
          >
            <Layers className="h-5 w-5" />
          </button>
          <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <button
              type="button"
              onClick={() => setViewState((v) => ({ ...v, zoom: Math.min(v.zoom + 0.65, 20) }))}
              className="border-b border-slate-200 p-2.5 text-slate-700 hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewState((v) => ({ ...v, zoom: Math.max(v.zoom - 0.65, 11) }))}
              className="p-2.5 text-slate-700 hover:bg-slate-100"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedAsset && (
        <div className="animate-in fade-in slide-in-from-bottom-4 absolute bottom-4 left-3 z-20 w-[calc(100%-1.5rem)] max-w-80 rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:bottom-10 sm:left-6 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <Badge className="border border-sky-200 bg-sky-50 text-[9px] font-semibold uppercase tracking-widest text-sky-700">
                {String((selectedAsset as { category?: string }).category ?? '')
                  .trim()
                  .replace(/_/g, ' ')}
              </Badge>
              <span className="block truncate font-mono text-[10px] text-slate-500">{selectedRid}</span>
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
          <h3 className="text-base font-semibold sm:text-lg">
            {(selectedAsset as { name_as?: string }).name_as || 'Infrastructure asset'}
          </h3>

          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
              <span className="text-[10px] font-semibold uppercase text-slate-500">Route (exchange)</span>
              <span className="text-xs font-semibold text-sky-700">
                {(selectedAsset as { exchange?: string | null }).exchange ?? 'Unassigned'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
              <span className="text-[10px] font-semibold uppercase text-slate-500">Elevation / depth</span>
              <span className="font-mono text-xs font-semibold text-sky-700">
                {(() => {
                  const g = (selectedAsset as { geometry?: Record<string, unknown> }).geometry
                  if (!g) return '—'
                  if (g.z_elevation != null) return `${g.z_elevation} m`
                  if (g.z_depth_ft != null) return `${g.z_depth_ft} ft (buried)`
                  if (g.z_height != null) return `${g.z_height} ft pole`
                  const paths = g.paths as number[][][] | undefined
                  const z0 = paths?.[0]?.[0]?.[2]
                  if (z0 !== undefined) return `${z0} m (line Z)`
                  return '—'
                })()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-[9px] font-semibold uppercase text-slate-500">Lat</p>
                <p className="font-mono text-[11px]">
                  {(() => {
                    const g = (selectedAsset as { geometry?: Record<string, unknown> }).geometry
                    if (!g) return '—'
                    if (g.y != null) return String(g.y)
                    const p = (g.paths as number[][][])?.[0]?.[0]
                    return p ? String(p[1]) : '—'
                  })()}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-[9px] font-semibold uppercase text-slate-500">Lng</p>
                <p className="font-mono text-[11px]">
                  {(() => {
                    const g = (selectedAsset as { geometry?: Record<string, unknown> }).geometry
                    if (!g) return '—'
                    if (g.x != null) return String(g.x)
                    const p = (g.paths as number[][][])?.[0]?.[0]
                    return p ? String(p[0]) : '—'
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
