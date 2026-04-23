import fundingData from '@/data/fin_funding.json'
import sensorData from '@/data/fin_sensor.json'
import {
  assets,
  controlMetrics,
  countByStatus,
  fleetAverages,
  securityEvents,
} from '@/data/mockData'
import { filterAssetsByRoute, fundingMatchesRouteFilter } from '@/lib/assetFilters'

type SensorCriticality = 'Critical' | 'High' | 'Medium' | 'Low'

type FundingFeature = {
  rid?: string
  exchange?: string | null
  lifecycle_state?: string
  security_label?: string
  sensor_metadata?: {
    sensor_uid?: string
  }
}

const HEALTH_SCORE_BY_CRITICALITY: Record<SensorCriticality, number> = {
  Critical: 25,
  High: 50,
  Medium: 75,
  Low: 100,
}

function flattenFundingFeatures() {
  return Object.values(fundingData as Record<string, FundingFeature[]>).flat()
}

function sensorCriticalityMap() {
  return new Map(sensorData.map((sensor) => [sensor.sensor_uid, sensor.criticality as SensorCriticality]))
}

function safePercent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 1000) / 10
}

export function buildRouteSnapshot(selectedRoute: string) {
  const allFunding = flattenFundingFeatures()
  const fundingScoped = allFunding.filter((item) => fundingMatchesRouteFilter(item, selectedRoute))
  const routeAssets = filterAssetsByRoute(assets, selectedRoute)
  const scopedAssets = routeAssets.length > 0 ? routeAssets : assets
  const scopedAssetIds = new Set(scopedAssets.map((asset) => asset.id))
  const scopedEvents = securityEvents.filter((event) => scopedAssetIds.has(event.asset))
  const effectiveEvents = scopedEvents.length > 0 ? scopedEvents : securityEvents

  const criticalityByUid = sensorCriticalityMap()
  let critical = 0
  let high = 0
  let medium = 0
  let low = 0
  let inService = 0
  let standardAccess = 0
  let totalHealthScore = 0

  for (const item of fundingScoped) {
    const criticality = criticalityByUid.get(item.sensor_metadata?.sensor_uid ?? '') ?? 'Low'
    const healthScore = HEALTH_SCORE_BY_CRITICALITY[criticality]
    totalHealthScore += healthScore

    if (criticality === 'Critical') critical += 1
    else if (criticality === 'High') high += 1
    else if (criticality === 'Medium') medium += 1
    else low += 1

    if (item.lifecycle_state === 'In-Service') inService += 1
    if (item.security_label === 'Standard-Access') standardAccess += 1
  }

  const fundingTotal = fundingScoped.length
  const avgFundingHealth = fundingTotal > 0 ? Math.round(totalHealthScore / fundingTotal) : 0
  const status = countByStatus(scopedAssets)
  const averages = fleetAverages(scopedAssets)
  const weightedSecurity = Math.round(
    controlMetrics.reduce((sum, metric) => sum + metric.value, 0) / controlMetrics.length,
  )

  return {
    selectedRoute,
    fundingTotal,
    routeAssetTotal: scopedAssets.length,
    inService,
    standardAccess,
    critical,
    high,
    medium,
    low,
    avgFundingHealth,
    status,
    averages,
    weightedSecurity,
    securityEvents: effectiveEvents,
    networkAvailability: safePercent(inService, Math.max(fundingTotal, 1)),
    complianceValidation: safePercent(standardAccess, Math.max(fundingTotal, 1)),
  }
}

