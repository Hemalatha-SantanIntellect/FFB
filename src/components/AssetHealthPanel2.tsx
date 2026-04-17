import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ChevronDown, Layers } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Data Imports
import fundingData from '@/data/fin_funding.json'
import sensorData from '@/data/fin_sensor.json'

const SEGMENT_COLORS = ['#34d399', '#fbbf24', '#fb7185']

export function AssetHealthPanel2() {
  const [selectedLayer, setSelectedLayer] = useState('All Assets')
  const [isOpen, setIsOpen] = useState(false)

  // Extract layer names (POLE, CONDUIT, etc.) from the funding JSON
  const layerKeys = useMemo(() => Object.keys(fundingData), [])

  const { healthy, warning, alertCount, total } = useMemo(() => {
    // 1. Resolve which assets to calculate based on the dropdown filter
    let assets: any[] = []
    if (selectedLayer === 'All Assets') {
      Object.values(fundingData).forEach((list: any) => {
        assets = assets.concat(list)
      })
    } else {
      assets = (fundingData as any)[selectedLayer] || []
    }

    // 2. Map sensor health for fast lookup
    const healthMap = new Map()
    sensorData.forEach((s) => {
      healthMap.set(s.sensor_uid, s.criticality)
    })

    // 3. Categorize statuses
    let aCount = 0 // Alert
    let wCount = 0 // Warning

    assets.forEach((asset) => {
      const uid = asset.sensor_metadata?.sensor_uid
      if (uid && healthMap.has(uid)) {
        const crit = healthMap.get(uid)
        // Map High/Critical to Alert, and Medium to Warning
        if (crit === 'Critical' || crit === 'High') {
          aCount++
        } else if (crit === 'Medium') {
          wCount++
        }
      }
    })

    const hCount = assets.length - aCount - wCount

    return {
      healthy: hCount,
      warning: wCount,
      alertCount: aCount,
      total: assets.length,
    }
  }, [selectedLayer])

  const chartData = useMemo(
    () => [
      { name: 'Healthy', value: healthy, fill: SEGMENT_COLORS[0] },
      { name: 'Warning', value: warning, fill: SEGMENT_COLORS[1] },
      { name: 'Alert', value: alertCount, fill: SEGMENT_COLORS[2] },
    ],
    [healthy, warning, alertCount],
  )

  const stats = useMemo(
    () => [
      {
        label: 'Healthy',
        count: healthy,
        labelClass: 'text-emerald-900',
        className: 'border-emerald-200/90 bg-emerald-50/95 text-emerald-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]',
      },
      {
        label: 'Warning',
        count: warning,
        labelClass: 'text-amber-950',
        className: 'border-amber-200/90 bg-amber-50/95 text-amber-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]',
      },
      {
        label: 'Alert',
        count: alertCount,
        labelClass: 'text-rose-950',
        className: 'border-rose-200/90 bg-rose-50/95 text-rose-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]',
      },
    ],
    [healthy, warning, alertCount],
  )

  return (
    <Card className="flex h-full flex-col border border-neutral-200/70 bg-white shadow-none">
      <CardHeader className="border-b border-neutral-100 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold tracking-tight text-neutral-900">
            Asset condition
          </CardTitle>
          
          {/* Layer Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-neutral-700 transition-all hover:bg-neutral-50 shadow-sm"
            >
              <Layers className="h-3 w-3 text-blue-600" />
              {selectedLayer.replace(/_/g, ' ')}
              <ChevronDown className={cn("h-3 w-3 text-neutral-400 transition-transform", isOpen && "rotate-180")} />
            </button>
            
            {isOpen && (
              <div className="absolute right-0 top-full z-[100] mt-1.5 max-h-64 w-48 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => { setSelectedLayer('All Assets'); setIsOpen(false); }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-colors",
                    selectedLayer === 'All Assets' ? "bg-blue-50 text-blue-700" : "hover:bg-neutral-50 text-neutral-600"
                  )}
                >
                  All Assets
                </button>
                <div className="my-1 h-px bg-neutral-100" />
                {layerKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedLayer(key); setIsOpen(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-colors",
                      selectedLayer === key ? "bg-blue-50 text-blue-700" : "hover:bg-neutral-100 text-neutral-600"
                    )}
                  >
                    {key.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
          Health Monitor
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        {/* Pie Chart Visualization */}
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
                  <Cell key={entry.name} fill={entry.fill} className="outline-none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold tabular-nums tracking-tight text-neutral-900 leading-none">
              {total}
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500">
              {selectedLayer === 'All Assets' ? 'monitored assets' : 'layer assets'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn("rounded-md border px-2 py-2.5 text-center transition-all", s.className)}
            >
              <p className={cn('text-[9px] font-bold uppercase tracking-wider opacity-80', s.labelClass)}>{s.label}</p>
              <p className="mt-0.5 text-lg font-black tabular-nums text-neutral-900 leading-none">{s.count}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}