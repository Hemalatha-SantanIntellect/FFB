import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from '@/components/ui/progress'
import type { ControlMetric } from '@/data/mockData'
import { cn } from '@/lib/utils'

function toneForValue(value: number) {
  if (value >= 80) {
    return {
      bar: 'bg-emerald-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
      track: 'bg-emerald-100/90',
      pct: 'text-emerald-800',
    }
  }
  if (value >= 65) {
    return {
      bar: 'bg-sky-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]',
      track: 'bg-sky-100/90',
      pct: 'text-sky-800',
    }
  }
  if (value >= 50) {
    return {
      bar: 'bg-amber-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]',
      track: 'bg-amber-100/90',
      pct: 'text-amber-900',
    }
  }
  return {
    bar: 'bg-rose-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]',
    track: 'bg-rose-100/90',
    pct: 'text-rose-800',
  }
}

type SecurityPostureProps = {
  metrics: ControlMetric[]
}

const LEGEND = [
  { label: '≥80%', swatch: 'bg-emerald-500', title: 'Strong' },
  { label: '65–79%', swatch: 'bg-sky-500', title: 'Good' },
  { label: '50–64%', swatch: 'bg-amber-500', title: 'Watch' },
  { label: '<50%', swatch: 'bg-rose-500', title: 'At risk' },
] as const

export function SecurityPosture({ metrics }: SecurityPostureProps) {
  return (
    <Card className="border border-violet-100/60 bg-gradient-to-b from-violet-50/25 via-white to-white shadow-none">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold tracking-tight text-neutral-900">
              Security posture
            </CardTitle>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
              Control effectiveness
            </p>
          </div>
          <div
            className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-[12px] font-medium text-neutral-600 sm:max-w-[min(100%,280px)]"
            aria-label="Score band legend"
          >
            {LEGEND.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 whitespace-nowrap"
                title={`${item.title}: ${item.label}`}
              >
                <span
                  className={cn('h-2 w-2 shrink-0 rounded-sm shadow-sm', item.swatch)}
                  aria-hidden
                />
                <span className="font-semibold tabular-nums text-neutral-700">{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3">
        {metrics.map((m) => {
          const tone = toneForValue(m.value)
          return (
            <div
              key={m.label}
              className="rounded-lg border border-neutral-100/80 bg-white/60 px-3 py-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]"
            >
              <div className="mb-1.5 flex justify-between text-[12px]">
                <span className="font-semibold text-neutral-700">{m.label}</span>
                <span className={cn('tabular-nums font-semibold', tone.pct)}>{m.value}%</span>
              </div>
              <Progress value={m.value}>
                <ProgressTrack className={cn('h-1.5 rounded-full', tone.track)}>
                  <ProgressIndicator
                    className={cn('rounded-full transition-all duration-700', tone.bar)}
                  />
                </ProgressTrack>
              </Progress>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
