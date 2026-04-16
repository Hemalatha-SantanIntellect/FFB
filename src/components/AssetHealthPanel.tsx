import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { assets as fleetAssets, countByStatus } from '@/data/mockData'
import { cn } from '@/lib/utils'

const SEGMENT_COLORS = ['#34d399', '#fbbf24', '#fb7185']

export function AssetHealthPanel() {
  const { healthy, warning, critical, total } = useMemo(
    () => countByStatus(fleetAssets),
    [],
  )

  const chartData = useMemo(
    () => [
      { name: 'Healthy', value: healthy, fill: SEGMENT_COLORS[0] },
      { name: 'Warning', value: warning, fill: SEGMENT_COLORS[1] },
      { name: 'Critical', value: critical, fill: SEGMENT_COLORS[2] },
    ],
    [healthy, warning, critical],
  )

  const stats = useMemo(
    () => [
      {
        label: 'Healthy',
        count: healthy,
        labelClass: 'text-emerald-900',
        className:
          'border-emerald-200/90 bg-emerald-50/95 text-emerald-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]',
      },
      {
        label: 'Warning',
        count: warning,
        labelClass: 'text-amber-950',
        className:
          'border-amber-200/90 bg-amber-50/95 text-amber-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]',
      },
      {
        label: 'Critical',
        count: critical,
        labelClass: 'text-rose-950',
        className:
          'border-rose-200/90 bg-rose-50/95 text-rose-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]',
      },
    ],
    [healthy, warning, critical],
  )

  return (
    <Card className="flex h-full flex-col border border-neutral-200/70 bg-white shadow-none">
      <CardHeader className="border-b border-neutral-100 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold tracking-tight text-neutral-900">
            Asset condition
          </CardTitle>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
          Health Monitor
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <div className="relative h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={96}
                paddingAngle={1.5}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold tabular-nums tracking-tight text-neutral-900">
              {total}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
              assets
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-md border px-2 py-2.5 text-center text-xs ${s.className}`}
            >
              <p className={cn('text-[10px] font-semibold', s.labelClass)}>{s.label}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-900">{s.count}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
