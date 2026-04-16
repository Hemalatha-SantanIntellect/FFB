import type { Asset } from '@/data/mockData'
import { ROUTE_DEFINITIONS } from '@/data/mockData'

const LABEL_TO_KEY = new Map(
  ROUTE_DEFINITIONS.map((r) => [r.label, r.id] as const),
)

export function filterAssetsByRoute(assetsList: Asset[], selectedRoute: string): Asset[] {
  if (selectedRoute === 'All Routes') return assetsList
  const key = LABEL_TO_KEY.get(selectedRoute)
  if (!key) return assetsList
  return assetsList.filter((a) => a.routeKey === key)
}
