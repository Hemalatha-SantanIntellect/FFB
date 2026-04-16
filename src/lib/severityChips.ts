import type { EventSeverity } from '@/data/mockData'

export function eventSeverityBadgeClass(severity: EventSeverity): string {
  switch (severity) {
    case 'critical':
      return 'border-0 bg-red-600 text-white shadow-sm'
    case 'high':
      return 'border-0 bg-amber-600 text-white shadow-sm'
    case 'medium':
      return 'border-0 bg-yellow-600 text-white shadow-sm'
    case 'low':
    default:
      return 'border-0 bg-green-600 text-white shadow-sm'
  }
}

export function threatLevelBadgeClass(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (level) {
    case 'HIGH':
      return eventSeverityBadgeClass('high')
    case 'MEDIUM':
      return eventSeverityBadgeClass('medium')
    case 'LOW':
    default:
      return eventSeverityBadgeClass('low')
  }
}
