import type { FeatureCollection, Polygon } from 'geojson'

import type { Asset } from '@/data/mockData'

function footprint(lng: number, lat: number, half: number): Polygon {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng - half, lat - half],
        [lng + half, lat - half],
        [lng + half, lat + half],
        [lng - half, lat + half],
        [lng - half, lat - half],
      ],
    ],
  }
}

function extrusionHeight(asset: Asset, selected: boolean): number {
  const base = 140 + asset.health * 10
  return selected ? base * 1.22 : base
}

export function buildAssetExtrusionCollection(
  assets: Asset[],
  selectedId: string,
): FeatureCollection {
  const half = 0.00034
  return {
    type: 'FeatureCollection',
    features: assets.map((a) => ({
      type: 'Feature' as const,
      id: a.id,
      properties: {
        id: a.id,
        status: a.status,
        height: extrusionHeight(a, a.id === selectedId),
      },
      geometry: footprint(a.lng, a.lat, half),
    })),
  }
}
