import { useEffect, useReducer, useMemo, useRef, useState, useId } from 'react'
import { Eye, EyeOff, Layers, X } from 'lucide-react'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
import type MapView from '@arcgis/core/views/MapView'
import type Layer from '@arcgis/core/layers/Layer'
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import Legend from '@arcgis/core/widgets/Legend'
import { cn } from '@/lib/utils'

type ArcgisLegendExpandContentProps = {
  view: MapView
}

function layerKey(layer: Layer): string {
  const fl = layer as FeatureLayer
  if (fl.url) return fl.url
  return String(layer.uid ?? layer.id ?? layer.title ?? Math.random())
}

export function ArcgisLegendExpandContent({ view }: ArcgisLegendExpandContentProps) {
  const layerModalId = useId()
  const legendHostRef = useRef<HTMLDivElement>(null)
  const legendWidgetRef = useRef<InstanceType<typeof Legend> | null>(null)
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const [layerModalOpen, setLayerModalOpen] = useState(false)

  // TOC order: top map layer first (reverse of map.layers draw order)
  const layersToc = useMemo(
    () => view.map?.layers.toArray().slice().reverse(),
    [view, bump],
  )

  useEffect(() => {
    const handle = reactiveUtils.watch(
      () =>
        view.map?.layers
          .toArray()
          .map((l) => `${layerKey(l)}:${l.visible}:${l.title ?? ''}`)
          .join('|'),
      () => bump(),
    )
    return () => handle.remove()
  }, [view])

  useEffect(() => {
    const el = legendHostRef.current
    if (!el) return

    const layerInfos = view.map?.layers.toArray().map((layer) => ({
      layer,
      title: layer.title ?? '',
    }))

    const legend = new Legend({
      view,
      container: el,
      respectLayerVisibility: false,
      layerInfos,
    })
    legendWidgetRef.current = legend

    return () => {
      legend.destroy()
      legendWidgetRef.current = null
    }
  }, [view])

  useEffect(() => {
    if (!layerModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setLayerModalOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [layerModalOpen])

  return (
    <div
      className={cn(
        'flex max-h-[min(72vh,560px)] w-[min(92vw,360px)] flex-col overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-xl',
      )}
    >
      {layerModalOpen && (
        <div
          className="fixed inset-0 z-[200000] flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLayerModalOpen(false)
          }}
        >
          <div
            className="flex w-full max-w-md flex-col rounded-xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            id={layerModalId}
            aria-labelledby={`${layerModalId}-title`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <h2
                id={`${layerModalId}-title`}
                className="text-sm font-semibold text-slate-800"
              >
                Map layers
              </h2>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close layer list"
                onClick={() => setLayerModalOpen(false)}
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <ul
              className="list-none space-y-0.5 overflow-y-auto px-2 py-2 [max-height:min(70vh,420px)]"
            >
              {layersToc.map((layer) => {
                const visible = layer.visible !== false
                const name = layer.title || 'Layer'
                return (
                  <li
                    key={layerKey(layer)}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                  >
                    <div
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600"
                      title="Layer"
                      aria-hidden
                    >
                      <Layers className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <span className="min-w-0 text-left text-[12px] font-medium text-slate-800">
                      {name}
                    </span>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors',
                        visible
                          ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200',
                      )}
                      title={visible ? 'Hide layer on map' : 'Show layer on map'}
                      aria-label={visible ? `Hide ${name}` : `Show ${name}`}
                      aria-pressed={visible}
                      onClick={() => {
                        layer.visible = !visible
                        bump()
                      }}
                    >
                      {visible ? (
                        <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      <div className="shrink-0 border-b border-slate-100 px-2 py-2">
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Layers
        </p>
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-medium text-slate-800 transition-colors hover:bg-slate-100"
          onClick={() => setLayerModalOpen(true)}
        >
          <Layers className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Open layer list
        </button>
      </div>

      <div className="shrink-0 px-2 py-2">
        <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Symbology
        </p>
        <div ref={legendHostRef} />
      </div>
    </div>
  )
}
