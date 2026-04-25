import fundingData from '@/data/fin_funding.json'
import { fundingMatchesRouteFilter } from '@/lib/assetFilters'

type FundingFeature = {
  category?: string
  guid?: string
  rid?: string
  name_as?: string
  serving_area?: string | null
  exchange?: string | null
  lifecycle_state?: string
  security_label?: string
  connectivity_logic?: {
    warning_code?: number
  }
  sensor_metadata?: {
    sensor_uid?: string
  }
}

function flattenFundingFeatures() {
  const flat: FundingFeature[] = []
  Object.entries(fundingData as Record<string, FundingFeature[]>).forEach(([category, items]) => {
    items.forEach((item) => flat.push({ ...item, category }))
  })
  return flat
}

function safePercent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 1000) / 10
}

function normalizeLifecycle(value?: string) {
  const raw = String(value ?? '').toLowerCase()
  if (raw.includes('maint')) return 'warning'
  if (raw.includes('plan') || raw.includes('down') || raw.includes('outage')) return 'critical'
  return 'healthy'
}

function securityScore(item: FundingFeature) {
  const securityLabel = String(item.security_label ?? '').toLowerCase()
  const warningCode = Number(item.connectivity_logic?.warning_code ?? 0)

  let score = 84
  if (securityLabel.includes('critical') || securityLabel === '1') score -= 30
  else if (securityLabel.includes('high') || securityLabel === '2') score -= 20
  else if (securityLabel.includes('medium') || securityLabel === '3') score -= 10
  score -= Math.min(40, warningCode * 10)
  return Math.max(5, Math.min(100, score))
}

function healthScore(item: FundingFeature) {
  const warningCode = Number(item.connectivity_logic?.warning_code ?? 0)
  const lifecycle = normalizeLifecycle(item.lifecycle_state)
  let score = lifecycle === 'healthy' ? 95 : lifecycle === 'warning' ? 64 : 38
  score -= Math.min(35, warningCode * 12)
  return Math.max(4, Math.min(100, score))
}

export function buildRouteSnapshot(selectedRoute: string) {
  const allFunding = flattenFundingFeatures()
  const fundingScoped = allFunding.filter((item) => fundingMatchesRouteFilter(item, selectedRoute))

  let critical = 0
  let high = 0
  let medium = 0
  let low = 0
  let healthy = 0
  let warning = 0
  let criticalState = 0
  let inService = 0
  let standardAccess = 0
  let totalHealthScore = 0
  let totalSecurityScore = 0

  const warningCandidates: {
    id: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    title: string
    asset: string
    timeAgo: string
    rank: number
  }[] = []

  for (const item of fundingScoped) {
    const hScore = healthScore(item)
    const sScore = securityScore(item)
    totalHealthScore += hScore
    totalSecurityScore += sScore

    const warningCode = Number(item.connectivity_logic?.warning_code ?? 0)
    const lifecycleClass = normalizeLifecycle(item.lifecycle_state)
    if (lifecycleClass === 'healthy') healthy += 1
    else if (lifecycleClass === 'warning') warning += 1
    else criticalState += 1

    if (String(item.lifecycle_state ?? '').toLowerCase().includes('in-service')) inService += 1
    if (String(item.security_label ?? '').toLowerCase().includes('standard')) standardAccess += 1

    const riskScore = Math.max(0, 100 - ((hScore + sScore) / 2))
    if (riskScore >= 70) critical += 1
    else if (riskScore >= 50) high += 1
    else if (riskScore >= 30) medium += 1
    else low += 1

    if (warningCode > 0 || item.category === 'Event Warning' || riskScore >= 50) {
      const severity: 'critical' | 'high' | 'medium' | 'low' =
        warningCode >= 3 || riskScore >= 75
          ? 'critical'
          : warningCode >= 2 || riskScore >= 60
            ? 'high'
            : warningCode >= 1 || riskScore >= 45
              ? 'medium'
              : 'low'
      warningCandidates.push({
        id: item.guid ?? item.rid ?? `${item.category}-${warningCandidates.length + 1}`,
        severity,
        title: `${item.category ?? 'Asset'} telemetry warning`,
        asset: item.rid ?? item.name_as ?? 'Unknown asset',
        timeAgo: 'Live',
        rank: warningCode * 30 + riskScore,
      })
    }
  }

  const fundingTotal = fundingScoped.length
  const avgFundingHealth = fundingTotal > 0 ? Math.round(totalHealthScore / fundingTotal) : 0
  const avgSecurity = fundingTotal > 0 ? Math.round(totalSecurityScore / fundingTotal) : 0

  const effectiveEvents = warningCandidates
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 8)
    .map(({ rank: _rank, ...event }) => event)

  const controlMetrics = [
    { label: 'Lifecycle serviceability', value: Math.round(safePercent(healthy, Math.max(fundingTotal, 1))) },
    { label: 'Security labeling hygiene', value: Math.round(safePercent(standardAccess, Math.max(fundingTotal, 1))) },
    {
      label: 'Warning containment',
      value: Math.max(0, 100 - Math.round(safePercent(warningCandidates.length, Math.max(fundingTotal, 1)))),
    },
    { label: 'Sensor confidence', value: avgFundingHealth },
    { label: 'Access trust posture', value: avgSecurity },
  ]
  const weightedSecurity = Math.round(controlMetrics.reduce((sum, metric) => sum + metric.value, 0) / controlMetrics.length)

  return {
    selectedRoute,
    fundingTotal,
    routeAssetTotal: fundingTotal,
    inService,
    standardAccess,
    critical,
    high,
    medium,
    low,
    avgFundingHealth,
    status: { healthy, warning, critical: criticalState, total: fundingTotal },
    averages: { health: avgFundingHealth, security: avgSecurity },
    weightedSecurity,
    controlMetrics,
    securityEvents: effectiveEvents,
    networkAvailability: safePercent(inService, Math.max(fundingTotal, 1)),
    complianceValidation: safePercent(standardAccess, Math.max(fundingTotal, 1)),
  }
}

