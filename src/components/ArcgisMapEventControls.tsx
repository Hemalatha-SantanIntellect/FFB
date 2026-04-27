import { useMemo, useState } from 'react'
import { Flag, Loader2, ShieldCheck } from 'lucide-react'

import { useEvents } from '@/context/EventsContext'
import fundingData from '@/data/fin_funding.json'
import { MAP_ASSET_CATEGORIES } from '@/lib/mapVisuals'
import {
  type MapEventLocationCandidate,
  resolveAllOpenEventsOnArcgis,
  runHealthMonitoringAgentMapFlow,
} from '@/lib/mapEventArcgisSync'

type ArcgisMapEventControlsProps = {
  onEventWarningLayerChange?: () => void
}

export function ArcgisMapEventControls({ onEventWarningLayerChange }: ArcgisMapEventControlsProps) {
  const { openEvents, createEvents, resolveEvent } = useEvents()
  const [isCreating, setIsCreating] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  const eventCandidates = useMemo((): MapEventLocationCandidate[] => {
    const out: MapEventLocationCandidate[] = []
    for (const category of MAP_ASSET_CATEGORIES) {
      const items = (fundingData as Record<string, unknown[]>)[category] ?? []
      for (const item of items as {
        rid?: string
        guid?: string
        name_as?: string
        EQUIP_NAME?: string
        geometry?: { x: number; y: number }
      }[]) {
        if (item.geometry?.x == null || item.geometry?.y == null) continue
        out.push({
          assetRid: String(item.rid ?? item.guid ?? ''),
          assetName: String(item.EQUIP_NAME ?? item.name_as ?? item.rid ?? 'Asset'),
          category,
          longitude: item.geometry.x,
          latitude: item.geometry.y,
        })
      }
    }
    return out
  }, [])

  const afterArcgis = () => {
    onEventWarningLayerChange?.()
  }

  return (
    <div className="pointer-events-auto absolute bottom-6 right-3 z-20 flex flex-col items-end gap-2 sm:bottom-6 sm:right-4">
      <button
        type="button"
        onClick={() => {
          void runHealthMonitoringAgentMapFlow(
            eventCandidates,
            createEvents,
            setIsCreating,
            afterArcgis,
          )
        }}
        disabled={isCreating}
        className="fc-control-btn rounded-lg border border-slate-200 bg-white p-2 shadow-md disabled:opacity-50"
        title="Create Event"
      >
        {isCreating ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <Flag className="h-5 w-5 text-rose-600" />
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          void resolveAllOpenEventsOnArcgis(
            openEvents,
            resolveEvent,
            setIsResolving,
            afterArcgis,
          )
        }}
        disabled={isResolving}
        className="fc-control-btn rounded-lg border border-slate-200 bg-white p-2 shadow-md disabled:opacity-50"
        title="Fix Event"
      >
        {isResolving ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        )}
      </button>
    </div>
  )
}
