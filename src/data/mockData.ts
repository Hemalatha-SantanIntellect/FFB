export type AssetStatus = 'healthy' | 'warning' | 'critical'
export type EventSeverity = 'critical' | 'high' | 'medium' | 'low'

export type RouteKey = '144' | '3' | '3B' | 'OTHER' | 'IND'

export interface Asset {
  id: string
  name: string
  route: string
  routeKey: RouteKey
  assetType: string
  lat: number
  lng: number
  status: AssetStatus
  health: number
  security: number
  firmware: string
  lastSeen: string
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  manager: string
}

export interface SecurityEvent {
  id: string
  severity: EventSeverity
  title: string
  asset: string
  timeAgo: string
}

export interface ControlMetric {
  label: string
  value: number
}

export const ROUTE_DEFINITIONS: {
  id: RouteKey
  color: string
  label: string
}[] = [
  { id: '144', color: '#f87171', label: 'Route 144 (East Coast)' },
  { id: '3', color: '#4ade80', label: 'Route 3 (West Valley)' },
  { id: '3B', color: '#60a5fa', label: 'Route 3B (Central)' },
  { id: 'OTHER', color: '#c084fc', label: 'Extended Grid (Others)' },
  { id: 'IND', color: '#fbbf24', label: 'Industrial High-Load' },
]

const ROUTE_KEY_TO_LABEL = Object.fromEntries(
  ROUTE_DEFINITIONS.map((r) => [r.id, r.label]),
) as Record<RouteKey, string>

function threatToLevel(threat: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  const t = threat.toLowerCase()
  if (t === 'critical' || t === 'high') return 'HIGH'
  if (t === 'medium') return 'MEDIUM'
  return 'LOW'
}

function mapRawAsset(a: {
  id: string
  name: string
  type: string
  route: string
  health: number
  security: number
  status: AssetStatus
  threat: string
  lat: number
  lng: number
  firmware: string
  lastSeen: string
  owner: string
}): Asset {
  const routeKey = a.route as RouteKey
  return {
    id: a.id,
    name: a.name,
    assetType: a.type,
    routeKey,
    route: ROUTE_KEY_TO_LABEL[routeKey] ?? a.route,
    lat: a.lat,
    lng: a.lng,
    status: a.status,
    health: a.health,
    security: a.security,
    firmware: a.firmware,
    lastSeen: a.lastSeen,
    threatLevel: threatToLevel(a.threat),
    manager: a.owner,
  }
}

const RAW_ASSETS = [
  { id: '3POLE-01', name: 'Pole - 3POLE-01', type: 'Pole', route: '3', health: 94, security: 88, status: 'healthy' as const, threat: 'low', lat: 43.5, lng: -89.2, firmware: 'v4.2.1', lastSeen: '2 min ago', owner: 'Field Team A' },
  { id: '3POLE-02', name: 'Pole - 3POLE-02', type: 'Pole', route: '3', health: 91, security: 91, status: 'healthy' as const, threat: 'low', lat: 43.85, lng: -89.65, firmware: 'v4.1.9', lastSeen: '3 min ago', owner: 'Field Team B' },
  { id: '3PED-03', name: 'Pedestal - 3PED-03', type: 'Pedestal', route: '3', health: 58, security: 54, status: 'warning' as const, threat: 'medium', lat: 44.15, lng: -89.1, firmware: 'v1.8.4', lastSeen: '11 min ago', owner: 'Edge Devices' },
  { id: '3POLE-04', name: 'Pole - 3POLE-04', type: 'Pole', route: '3', health: 88, security: 85, status: 'healthy' as const, threat: 'low', lat: 44.4, lng: -89.8, firmware: 'v4.2.0', lastSeen: '5 min ago', owner: 'Field Team A' },
  { id: '3CAB-05', name: 'Cabinet - 3CAB-05', type: 'Cabinet', route: '3', health: 92, security: 78, status: 'healthy' as const, threat: 'low', lat: 44.8, lng: -89.25, firmware: 'v2.8.1', lastSeen: '1 min ago', owner: 'Infra Team' },
  { id: '3HH-06', name: 'Handhole - 3HH-06', type: 'Handhole', route: '3', health: 99, security: 90, status: 'healthy' as const, threat: 'low', lat: 45.1, lng: -89.95, firmware: 'n/a', lastSeen: '15 min ago', owner: 'Civil Ops' },
  { id: '3POLE-07', name: 'Pole - 3POLE-07', type: 'Pole', route: '3', health: 42, security: 66, status: 'warning' as const, threat: 'medium', lat: 44.95, lng: -90.4, firmware: 'v4.1.5', lastSeen: '30 min ago', owner: 'Field Team B' },
  { id: '3TRANS-08', name: 'Transformer - 3TRANS-08', type: 'Ground Transformer', route: '3', health: 75, security: 82, status: 'healthy' as const, threat: 'low', lat: 44.5, lng: -90.8, firmware: 'v3.2.1', lastSeen: '4 min ago', owner: 'Power Grid' },
  { id: '3POLE-09', name: 'Pole - 3POLE-09', type: 'Pole', route: '3', health: 95, security: 98, status: 'healthy' as const, threat: 'low', lat: 44.1, lng: -90.3, firmware: 'v4.2.1', lastSeen: '2 min ago', owner: 'Field Team A' },
  { id: '3PED-10', name: 'Pedestal - 3PED-10', type: 'Pedestal', route: '3', health: 81, security: 77, status: 'healthy' as const, threat: 'low', lat: 43.7, lng: -90.75, firmware: 'v1.8.5', lastSeen: '8 min ago', owner: 'Edge Devices' },
  { id: '3B/03', name: 'Transformer - 3B/03', type: 'Ground Transformer', route: '3B', health: 46, security: 72, status: 'warning' as const, threat: 'medium', lat: 43.2, lng: -88.72, firmware: 'v3.9.8', lastSeen: '8 min ago', owner: 'Substation Ops' },
  { id: 'TRANS-17', name: 'Transformer - TRANS-17', type: 'Ground Transformer', route: '3B', health: 63, security: 61, status: 'warning' as const, threat: 'medium', lat: 43.6, lng: -88.1, firmware: 'v3.4.0', lastSeen: '6 min ago', owner: 'Power Grid Team' },
  { id: '3B-HH-11', name: 'Handhole - 3B-HH-11', type: 'Handhole', route: '3B', health: 94, security: 92, status: 'healthy' as const, threat: 'low', lat: 44.2, lng: -88.5, firmware: 'n/a', lastSeen: '12 min ago', owner: 'Civil Ops' },
  { id: '3B-CAB-12', name: 'Cabinet - 3B-CAB-12', type: 'Cabinet', route: '3B', health: 85, security: 80, status: 'healthy' as const, threat: 'low', lat: 43.9, lng: -87.8, firmware: 'v2.7.9', lastSeen: '3 min ago', owner: 'Infra Team' },
  { id: '3B-PED-13', name: 'Pedestal - 3B-PED-13', type: 'Pedestal', route: '3B', health: 25, security: 45, status: 'critical' as const, threat: 'high', lat: 44.5, lng: -88.2, firmware: 'v1.1.8', lastSeen: '45 min ago', owner: 'SecOps' },
  { id: '3B-POLE-14', name: 'Pole - 3B-POLE-14', type: 'Pole', route: '3B', health: 90, security: 88, status: 'healthy' as const, threat: 'low', lat: 44.85, lng: -87.5, firmware: 'v4.2.1', lastSeen: '1 min ago', owner: 'Field Team B' },
  { id: '3B-TRANS-15', name: 'Transformer - 3B-TRANS-15', type: 'Ground Transformer', route: '3B', health: 77, security: 74, status: 'healthy' as const, threat: 'low', lat: 45.2, lng: -88.0, firmware: 'v3.4.2', lastSeen: '9 min ago', owner: 'Power Grid Team' },
  { id: '3B-POLE-16', name: 'Pole - 3B-POLE-16', type: 'Pole', route: '3B', health: 93, security: 95, status: 'healthy' as const, threat: 'low', lat: 44.9, lng: -88.9, firmware: 'v4.2.1', lastSeen: '5 min ago', owner: 'Field Team A' },
  { id: '3B-HH-17', name: 'Handhole - 3B-HH-17', type: 'Handhole', route: '3B', health: 88, security: 84, status: 'healthy' as const, threat: 'low', lat: 44.3, lng: -87.4, firmware: 'n/a', lastSeen: '20 min ago', owner: 'Civil Ops' },
  { id: '3B-CAB-18', name: 'Cabinet - 3B-CAB-18', type: 'Cabinet', route: '3B', health: 55, security: 52, status: 'warning' as const, threat: 'medium', lat: 43.75, lng: -87.95, firmware: 'v2.7.0', lastSeen: '14 min ago', owner: 'Infra Team' },
  { id: 'CAB-09', name: 'Cabinet - CAB-09', type: 'Cabinet', route: '144', health: 79, security: 41, status: 'warning' as const, threat: 'high', lat: 43.1, lng: -87.2, firmware: 'v2.7.3', lastSeen: '1 min ago', owner: 'Infra Team' },
  { id: 'HH-21', name: 'Handhole - HH-21', type: 'Handhole', route: '144', health: 97, security: 95, status: 'healthy' as const, threat: 'low', lat: 43.65, lng: -86.8, firmware: 'n/a', lastSeen: '5 min ago', owner: 'Civil Ops' },
  { id: 'CAB-12', name: 'Cabinet - CAB-12', type: 'Cabinet', route: '144', health: 22, security: 27, status: 'critical' as const, threat: 'critical', lat: 44.1, lng: -87.3, firmware: 'v2.2.5', lastSeen: '17 min ago', owner: 'SecOps' },
  { id: '144-POLE-19', name: 'Pole - 144-POLE-19', type: 'Pole', route: '144', health: 82, security: 80, status: 'healthy' as const, threat: 'low', lat: 44.6, lng: -86.95, firmware: 'v4.1.2', lastSeen: '6 min ago', owner: 'Field Team A' },
  { id: '144-TRANS-20', name: 'Transformer - 144-TRANS-20', type: 'Ground Transformer', route: '144', health: 68, security: 65, status: 'warning' as const, threat: 'medium', lat: 45.15, lng: -87.25, firmware: 'v3.3.1', lastSeen: '11 min ago', owner: 'Power Grid' },
  { id: '144-PED-21', name: 'Pedestal - 144-PED-21', type: 'Pedestal', route: '144', health: 91, security: 88, status: 'healthy' as const, threat: 'low', lat: 45.45, lng: -86.85, firmware: 'v1.8.2', lastSeen: '2 min ago', owner: 'Edge Devices' },
  { id: '144-HH-22', name: 'Handhole - 144-HH-22', type: 'Handhole', route: '144', health: 95, security: 92, status: 'healthy' as const, threat: 'low', lat: 44.95, lng: -86.4, firmware: 'n/a', lastSeen: '19 min ago', owner: 'Civil Ops' },
  { id: '144-POLE-23', name: 'Pole - 144-POLE-23', type: 'Pole', route: '144', health: 35, security: 50, status: 'critical' as const, threat: 'high', lat: 44.4, lng: -86.7, firmware: 'v4.0.9', lastSeen: '55 min ago', owner: 'Field Team B' },
  { id: '144-CAB-24', name: 'Cabinet - 144-CAB-24', type: 'Cabinet', route: '144', health: 88, security: 82, status: 'healthy' as const, threat: 'low', lat: 43.85, lng: -86.5, firmware: 'v2.8.0', lastSeen: '4 min ago', owner: 'Infra Team' },
  { id: '144-TRANS-25', name: 'Transformer - 144-TRANS-25', type: 'Ground Transformer', route: '144', health: 74, security: 70, status: 'healthy' as const, threat: 'low', lat: 43.3, lng: -86.85, firmware: 'v3.3.9', lastSeen: '7 min ago', owner: 'Power Grid' },
  { id: 'PED-12', name: 'Pedestal - PED-12', type: 'Pedestal', route: 'OTHER', health: 18, security: 33, status: 'critical' as const, threat: 'critical', lat: 42.5, lng: -88.5, firmware: 'v1.2.0', lastSeen: '21 min ago', owner: 'SecOps' },
  { id: 'HH-08', name: 'Handhole - HH-08', type: 'Handhole', route: 'OTHER', health: 84, security: 82, status: 'healthy' as const, threat: 'low', lat: 45.8, lng: -89.5, firmware: 'n/a', lastSeen: '9 min ago', owner: 'Civil Ops' },
  { id: 'OTH-POLE-26', name: 'Pole - OTH-POLE-26', type: 'Pole', route: 'OTHER', health: 92, security: 90, status: 'healthy' as const, threat: 'low', lat: 42.8, lng: -91.0, firmware: 'v4.2.1', lastSeen: '3 min ago', owner: 'Field Team A' },
  { id: 'OTH-TRANS-27', name: 'Transformer - OTH-TRANS-27', type: 'Ground Transformer', route: 'OTHER', health: 51, security: 58, status: 'warning' as const, threat: 'medium', lat: 45.3, lng: -91.5, firmware: 'v3.1.2', lastSeen: '13 min ago', owner: 'Power Grid' },
  { id: 'OTH-HH-28', name: 'Handhole - OTH-HH-28', type: 'Handhole', route: 'OTHER', health: 96, security: 94, status: 'healthy' as const, threat: 'low', lat: 42.2, lng: -87.5, firmware: 'n/a', lastSeen: '22 min ago', owner: 'Civil Ops' },
  { id: 'OTH-CAB-29', name: 'Cabinet - OTH-CAB-29', type: 'Cabinet', route: 'OTHER', health: 87, security: 85, status: 'healthy' as const, threat: 'low', lat: 46.1, lng: -88.2, firmware: 'v2.8.2', lastSeen: '5 min ago', owner: 'Infra Team' },
  { id: 'OTH-PED-30', name: 'Pedestal - OTH-PED-30', type: 'Pedestal', route: 'OTHER', health: 31, security: 48, status: 'critical' as const, threat: 'high', lat: 42.1, lng: -90.2, firmware: 'v1.2.5', lastSeen: '40 min ago', owner: 'SecOps' },
  { id: 'OTH-POLE-31', name: 'Pole - OTH-POLE-31', type: 'Pole', route: 'OTHER', health: 89, security: 88, status: 'healthy' as const, threat: 'low', lat: 45.5, lng: -86.2, firmware: 'v4.2.0', lastSeen: '2 min ago', owner: 'Field Team B' },
  { id: 'OTH-TRANS-32', name: 'Transformer - OTH-TRANS-32', type: 'Ground Transformer', route: 'OTHER', health: 65, security: 62, status: 'warning' as const, threat: 'medium', lat: 41.8, lng: -88.9, firmware: 'v3.3.4', lastSeen: '10 min ago', owner: 'Power Grid' },
  { id: 'OTH-HH-33', name: 'Handhole - OTH-HH-33', type: 'Handhole', route: 'OTHER', health: 94, security: 91, status: 'healthy' as const, threat: 'low', lat: 46.5, lng: -89.8, firmware: 'n/a', lastSeen: '16 min ago', owner: 'Civil Ops' },
  { id: 'X-POLE-51', name: 'Pole - X-POLE-51', type: 'Pole', route: '3', health: 70, security: 65, status: 'warning' as const, threat: 'low', lat: 42.9, lng: -89.8, firmware: 'v4.2.1', lastSeen: '4 min ago', owner: 'Field Team A' },
  { id: 'X-TRANS-52', name: 'Transformer - X-TRANS-52', type: 'Ground Transformer', route: '3B', health: 88, security: 80, status: 'healthy' as const, threat: 'low', lat: 45.7, lng: -87.8, firmware: 'v3.5.1', lastSeen: '7 min ago', owner: 'Power Grid' },
  { id: 'X-CAB-53', name: 'Cabinet - X-CAB-53', type: 'Cabinet', route: '144', health: 15, security: 20, status: 'critical' as const, threat: 'critical', lat: 43.4, lng: -86.1, firmware: 'v2.1.0', lastSeen: '25 min ago', owner: 'SecOps' },
  { id: 'X-HH-54', name: 'Handhole - X-HH-54', type: 'Handhole', route: 'OTHER', health: 91, security: 88, status: 'healthy' as const, threat: 'low', lat: 41.5, lng: -91.2, firmware: 'n/a', lastSeen: '14 min ago', owner: 'Civil Ops' },
  { id: 'X-PED-55', name: 'Pedestal - X-PED-55', type: 'Pedestal', route: '3', health: 22, security: 41, status: 'critical' as const, threat: 'critical', lat: 46.2, lng: -87.4, firmware: 'v1.2.9', lastSeen: '50 min ago', owner: 'SecOps' },
  { id: 'X-POLE-56', name: 'Pole - X-POLE-56', type: 'Pole', route: '3B', health: 87, security: 84, status: 'healthy' as const, threat: 'low', lat: 42.0, lng: -88.0, firmware: 'v4.2.1', lastSeen: '4 min ago', owner: 'Field Team B' },
  { id: 'X-TRANS-57', name: 'Transformer - X-TRANS-57', type: 'Ground Transformer', route: '144', health: 70, security: 68, status: 'warning' as const, threat: 'medium', lat: 45.9, lng: -90.6, firmware: 'v3.5.5', lastSeen: '8 min ago', owner: 'Power Grid' },
  { id: 'X-CAB-58', name: 'Cabinet - X-CAB-58', type: 'Cabinet', route: 'OTHER', health: 94, security: 92, status: 'healthy' as const, threat: 'low', lat: 41.2, lng: -86.5, firmware: 'v2.9.2', lastSeen: '2 min ago', owner: 'Infra Team' },
  { id: 'X-HH-59', name: 'Handhole - X-HH-59', type: 'Handhole', route: '3', health: 85, security: 80, status: 'healthy' as const, threat: 'low', lat: 46.8, lng: -91.1, firmware: 'n/a', lastSeen: '18 min ago', owner: 'Civil Ops' },
  { id: 'X-POLE-60', name: 'Pole - X-POLE-60', type: 'Pole', route: '144', health: 55, security: 60, status: 'warning' as const, threat: 'medium', lat: 42.3, lng: -86.0, firmware: 'v4.1.8', lastSeen: '12 min ago', owner: 'Field Team A' },
] as const

export const assets: Asset[] = RAW_ASSETS.map((r) => mapRawAsset(r))

export const securityEvents: SecurityEvent[] = [
  { id: '1', severity: 'critical', title: 'Unauthorized cabinet access detected', asset: 'CAB-12', timeAgo: '2 min ago' },
  { id: '2', severity: 'high', title: 'Health degradation spike on TRANS-17', asset: 'TRANS-17', timeAgo: '7 min ago' },
  { id: '3', severity: 'medium', title: 'Signal drop on 3B route cluster', asset: '3B/03', timeAgo: '14 min ago' },
  { id: '4', severity: 'low', title: 'Routine sync completed', asset: '3POLE-02', timeAgo: '18 min ago' },
]

export const controlMetrics: ControlMetric[] = [
  { label: 'IAM / RBAC', value: 92 },
  { label: 'Field Device Auth', value: 76 },
  { label: 'Event Correlation', value: 81 },
  { label: 'Tamper Alerts', value: 64 },
  { label: 'Encryption', value: 89 },
  { label: 'Log Retention', value: 73 },
]

export const routes = ['All Routes', ...ROUTE_DEFINITIONS.map((r) => r.label)]

export function countByStatus(list: Asset[]) {
  let healthy = 0
  let warning = 0
  let critical = 0
  for (const a of list) {
    if (a.status === 'healthy') healthy += 1
    else if (a.status === 'warning') warning += 1
    else critical += 1
  }
  return { healthy, warning, critical, total: list.length }
}

export function fleetAverages(list: Asset[]) {
  if (list.length === 0) return { health: 0, security: 0 }
  const h = list.reduce((s, a) => s + a.health, 0) / list.length
  const sec = list.reduce((s, a) => s + a.security, 0) / list.length
  return { health: Math.round(h), security: Math.round(sec) }
}

export const DEFAULT_MAP_VIEW = {
  longitude: -88.25,
  latitude: 44.0,
  zoom: 6.35,
  pitch: 52,
  bearing: -32,
} as const
