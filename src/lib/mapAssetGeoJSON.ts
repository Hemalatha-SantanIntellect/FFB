import type { FeatureCollection } from 'geojson'

import type { Asset, RouteKey } from '@/data/mockData'

export const ROUTE_LINE_COLORS: Record<RouteKey, string> = {
  '144': '#b91c1c',
  '3': '#15803d',
  '3B': '#1d4ed8',
  OTHER: '#7c3aed',
  IND: '#d97706',
}

const ROUTE_COLOR: Record<RouteKey, string> = ROUTE_LINE_COLORS

export const ASSET_TYPE_COLORS: Record<string, string> = {
  Pole: '#15803d',
  Pedestal: '#7c3aed',
  Cabinet: '#0369a1',
  Handhole: '#475569',
  'Ground Transformer': '#b45309',
}

function typeColor(t: string): string {
  return ASSET_TYPE_COLORS[t] ?? '#525252'
}

export function getAssetMapImageId(assetType: string): string {
  if (assetType in ASSET_TYPE_COLORS) {
    return `gis-type-${assetType.toLowerCase().replace(/\s+/g, '-')}`
  }
  return 'gis-type-unknown'
}

export function buildAssetPointsCollection(
  assets: Asset[],
  selectedId: string,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: assets.map((a) => ({
      type: 'Feature' as const,
      id: a.id,
      properties: {
        id: a.id,
        name: a.name,
        assetType: a.assetType,
        status: a.status,
        routeKey: a.routeKey,
        typeColor: typeColor(a.assetType),
        iconId: getAssetMapImageId(a.assetType),
        selected: a.id === selectedId ? 1 : 0,
      },
      geometry: {
        type: 'Point',
        coordinates: [a.lng, a.lat],
      },
    })),
  }
}

export function buildRouteLineCollection(assets: Asset[]): FeatureCollection {
  const byRoute = new Map<RouteKey, Asset[]>()
  for (const a of assets) {
    const list = byRoute.get(a.routeKey) ?? []
    list.push(a)
    byRoute.set(a.routeKey, list)
  }

  const features: FeatureCollection['features'] = []
  for (const [key, list] of byRoute) {
    if (list.length < 2) continue
    const sorted = [...list].sort((x, y) => x.lng - y.lng || x.lat - y.lat)
    const coordinates = sorted.map((x) => [x.lng, x.lat] as [number, number])
    features.push({
      type: 'Feature',
      properties: {
        routeKey: key,
        lineColor: ROUTE_COLOR[key] ?? '#737373',
      },
      geometry: {
        type: 'LineString',
        coordinates,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
