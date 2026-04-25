export function fundingItemRouteLabel(item: { exchange?: string | null; serving_area?: string | null }): string {
  const exchange = String(item.exchange ?? '').trim()
  if (exchange) return exchange
  const servingArea = String(item.serving_area ?? '').trim()
  if (servingArea) return servingArea
  return 'Unassigned'
}

/** Whether a funding GIS feature should appear for the current TopBar route selection. */
export function fundingMatchesRouteFilter(
  item: { exchange?: string | null; serving_area?: string | null },
  selectedRoute: string,
): boolean {
  if (selectedRoute === 'All Routes') return true
  return fundingItemRouteLabel(item) === selectedRoute
}

export function filterAssetsByRoute<T extends { route?: string }>(assetsList: T[], selectedRoute: string): T[] {
  if (selectedRoute === 'All Routes') return assetsList
  return assetsList.filter((a) => a.route === selectedRoute)
}
