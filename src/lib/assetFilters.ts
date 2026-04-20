import type { Asset, RouteKey } from '@/data/mockData'
import { ROUTE_DEFINITIONS } from '@/data/mockData'

const LABEL_TO_KEY = new Map(
  ROUTE_DEFINITIONS.map((r) => [r.label, r.id] as const),
)

/** Maps GIS funding `exchange` values to dashboard route keys (TopBar filter). */
const FUNDING_EXCHANGE_TO_ROUTE: Record<string, RouteKey> = {
  Hallie: '3',
  Truax: '3B',
  'Fall Creek': '144',
  'Eau Claire': 'OTHER',
  Seymour: 'IND',
}

export function fundingItemRouteKey(item: { exchange?: string | null }): RouteKey {
  if (!item.exchange) return 'OTHER'
  return FUNDING_EXCHANGE_TO_ROUTE[item.exchange] ?? 'OTHER'
}

/** Whether a funding GIS feature should appear for the current TopBar route selection. */
export function fundingMatchesRouteFilter(
  item: { exchange?: string | null },
  selectedRoute: string,
): boolean {
  if (selectedRoute === 'All Routes') return true
  const key = LABEL_TO_KEY.get(selectedRoute)
  if (!key) return true
  return fundingItemRouteKey(item) === key
}

export function filterAssetsByRoute(assetsList: Asset[], selectedRoute: string): Asset[] {
  if (selectedRoute === 'All Routes') return assetsList
  const routeKey = LABEL_TO_KEY.get(selectedRoute)
  if (!routeKey) return assetsList
  return assetsList.filter((a) => a.routeKey === routeKey)
}
