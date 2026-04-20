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

export function SecurityPosture({ metrics }: SecurityPostureProps) {
  return (
    <div className="space-y-2">
      {metrics.map((m) => {
        const tone = toneForValue(m.value)
        return (
          <div
            key={m.label}
            className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5"
          >
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-slate-700">{m.label}</span>
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
    </div>
  )
}
