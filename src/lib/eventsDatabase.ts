export type MapEventStatus = 'open' | 'fixed'

export type MapEventRecord = {
  id: string
  assetRid: string
  assetName: string
  category: string
  longitude: number
  latitude: number
  status: MapEventStatus
  createdAt: string
  fixedAt: string | null
}

const EVENTS_DB_KEY = 'fusioncenter.events.db.v1'

export function loadEventsFromDb(): MapEventRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(EVENTS_DB_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MapEventRecord[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveEventsToDb(events: MapEventRecord[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(EVENTS_DB_KEY, JSON.stringify(events))
}

export function createEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
