import { X } from 'lucide-react'

import type { MapEventRecord } from '@/lib/eventsDatabase'
import { cn } from '@/lib/utils'

type EventFixModalProps = {
  open: boolean
  events: MapEventRecord[]
  sessionTotal: number
  resolvedCount: number
  onResolveCurrent: () => void
  onClose: () => void
}

export function EventFixModal({
  open,
  events,
  sessionTotal,
  resolvedCount,
  onResolveCurrent,
  onClose,
}: EventFixModalProps) {
  if (!open) return null

  const progress = sessionTotal > 0 ? Math.min(100, Math.round((resolvedCount / sessionTotal) * 100)) : 0
  const currentEvent = events[0]
  const done = sessionTotal > 0 && resolvedCount >= sessionTotal

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Event resolution queue</p>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">Fix Event</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close event fix modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>Progress</span>
              <span>
                {resolvedCount}/{sessionTotal}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {currentEvent ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current event</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{currentEvent.assetName || currentEvent.assetRid}</p>
              <p className="text-[11px] font-medium text-slate-600">
                {currentEvent.assetRid} • {currentEvent.category}
              </p>
              <p className="mt-1 text-[11px] text-slate-600">
                Created {new Date(currentEvent.createdAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[12px] font-medium text-emerald-700">
              {done ? 'All queued events have been resolved.' : 'No open events available.'}
            </div>
          )}

          {events.length > 0 && (
            <div className="max-h-44 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-white p-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    'rounded-md border px-2.5 py-2 text-[11px]',
                    event.id === currentEvent?.id
                      ? 'border-sky-300 bg-sky-50 text-sky-900'
                      : 'border-slate-200 bg-white text-slate-700',
                  )}
                >
                  <p className="font-semibold">{event.assetRid}</p>
                  <p className="truncate">{event.category}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={onResolveCurrent}
            disabled={!currentEvent}
            className="rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resolve current event
          </button>
        </div>
      </div>
    </div>
  )
}
