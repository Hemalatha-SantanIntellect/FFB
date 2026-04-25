import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  createEventId,
  loadEventsFromDb,
  saveEventsToDb,
  type MapEventRecord,
} from '@/lib/eventsDatabase'

type CreateEventInput = {
  assetRid: string
  assetName: string
  category: string
  longitude: number
  latitude: number
}

type EventsContextValue = {
  events: MapEventRecord[]
  openEvents: MapEventRecord[]
  fixedEvents: MapEventRecord[]
  createEvents: (items: CreateEventInput[]) => MapEventRecord[]
  resolveEvent: (eventId: string) => void
}

const EventsContext = createContext<EventsContextValue | null>(null)

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<MapEventRecord[]>(() => loadEventsFromDb())

  useEffect(() => {
    saveEventsToDb(events)
  }, [events])

  const value = useMemo<EventsContextValue>(() => {
    const sorted = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const openEvents = sorted.filter((event) => event.status === 'open')
    const fixedEvents = sorted.filter((event) => event.status === 'fixed')

    function createEvents(items: CreateEventInput[]) {
      const timestamp = new Date().toISOString()
      const created = items.map((item) => ({
        id: createEventId(),
        assetRid: item.assetRid,
        assetName: item.assetName,
        category: item.category,
        longitude: item.longitude,
        latitude: item.latitude,
        status: 'open' as const,
        createdAt: timestamp,
        fixedAt: null,
      }))
      setEvents((prev) => [...created, ...prev])
      return created
    }

    function resolveEvent(eventId: string) {
      const fixedAt = new Date().toISOString()
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId && event.status === 'open'
            ? {
                ...event,
                status: 'fixed',
                fixedAt,
              }
            : event,
        ),
      )
    }

    return {
      events: sorted,
      openEvents,
      fixedEvents,
      createEvents,
      resolveEvent,
    }
  }, [events])

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) {
    throw new Error('useEvents must be used within EventsProvider')
  }
  return ctx
}
