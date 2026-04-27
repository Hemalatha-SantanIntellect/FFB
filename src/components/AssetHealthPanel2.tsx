import { useCallback, useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ChevronDown, Layers, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Data Imports
import fundingData from '@/data/fin_funding.json'

const SEGMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'] // Emerald, Amber, Rose
const SN_INSTANCE = 'https://accelareincdemo7.service-now.com'
const AUTH = btoa('gautham_api_interface:AccelareDemo7#')

export function AssetHealthPanel2() {
  const [selectedLayer, setSelectedLayer] = useState('All Assets')
  const [isOpen, setIsOpen] = useState(false)
  const [snEvents, setSnEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 1. Fetch live event data from ServiceNow
  const fetchLiveHealth = useCallback(async () => {
    setLoading(true)
    try {
      const query = 'source=ONTData^resolution_state=New'
      const response = await fetch(
        `${SN_INSTANCE}/api/now/table/em_event?sysparm_query=${encodeURIComponent(query)}`,
        { headers: { 'Authorization': `Basic ${AUTH}`, 'Accept': 'application/json' } }
      )
      const data = await response.json()
      setSnEvents(data.result || [])
    } catch (err) {
      console.error("Health Panel Sync Error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLiveHealth()
    // Poll every 30 seconds to keep the dashboard "live"
    const interval = setInterval(fetchLiveHealth, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveHealth])

  const layerKeys = useMemo(
    () => Object.keys(fundingData).filter(
      (key) => Array.isArray((fundingData as Record<string, unknown[]>)[key]) && (fundingData as Record<string, unknown[]>)[key].length > 0,
    ),
    [],
  )

  const { healthy, warning, alertCount, total } = useMemo(() => {
    let assets: any[] = []
    if (selectedLayer === 'All Assets') {
      Object.values(fundingData).forEach((list: any) => { assets = assets.concat(list) })
    } else {
      assets = (fundingData as any)[selectedLayer] || []
    }

    // Map ServiceNow events to Nodes for lookup
    const activeAlertNodes = new Set(snEvents.map(e => e.node))

    let aCount = 0 // Alert (Live ServiceNow "New" Events)
    let wCount = 0 // Warning (Calculated from Severity 2-3 in data if any)

    assets.forEach((asset) => {
      const nodeName = asset.EQUIP_NAME || asset.name_as
      if (activeAlertNodes.has(nodeName)) {
        aCount++
      }
    })

    // Healthy is total assets in current view minus active ServiceNow alerts
    const hCount = Math.max(0, assets.length - aCount - wCount)

    return {
      healthy: hCount,
      warning: wCount,
      alertCount: aCount,
      total: assets.length,
    }
  }, [selectedLayer, snEvents])

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
        className: 'border-emerald-200/90 bg-emerald-50/95 text-emerald-950' 
      },
      { 
        label: 'Warning', 
        count: warning, 
        labelClass: 'text-amber-950', 
        className: 'border-amber-200/90 bg-amber-50/95 text-amber-950' 
      },
      { 
        label: 'Alert', 
        count: alertCount, 
        labelClass: 'text-rose-950', 
        className: 'border-rose-200/90 bg-rose-50/95 text-rose-950' 
      },
    ],
    [healthy, warning, alertCount],
  )

  return (
    <Card className="fc-panel flex h-full flex-col">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="fc-section-title">Asset condition</CardTitle>
            <button onClick={fetchLiveHealth} disabled={loading}>
              <RefreshCw className={cn("h-3 w-3 text-slate-400", loading && "animate-spin")} />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              <Layers className="h-3 w-3 text-sky-700" />
              {selectedLayer.replace(/_/g, ' ')}
              <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full z-[100] mt-1.5 max-h-64 w-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => { setSelectedLayer('All Assets'); setIsOpen(false); }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-colors",
                    selectedLayer === 'All Assets' ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  All Assets
                </button>
                <div className="my-1 h-px bg-slate-100" />
                {layerKeys.map((key) => (
                  <button 
                    key={key} 
                    onClick={() => { setSelectedLayer(key); setIsOpen(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-colors",
                      selectedLayer === key ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {key.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="fc-eyebrow flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full bg-emerald-500", loading && "animate-pulse")} />
          Live ServiceNow Sync
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 items-center justify-center pt-4">
        <div className="flex w-full max-w-[330px] flex-col items-center gap-4">
          <div className="relative -mt-5 h-[280px] w-full max-w-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={80} 
                  outerRadius={114} 
                  paddingAngle={2} 
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} className="outline-none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-slate-900">
                {total}
              </span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {selectedLayer === 'All Assets' ? 'total assets' : 'layer assets'}
              </span>
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-1.5">
            {stats.map((s) => (
              <div 
                key={s.label} 
                className={cn("rounded-md border px-2 py-2.5 text-center shadow-sm transition-all", s.className)}
              >
                <p className={cn('text-[9px] font-semibold uppercase tracking-wider opacity-80', s.labelClass)}>
                  {s.label}
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums leading-none text-slate-900">
                  {s.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}