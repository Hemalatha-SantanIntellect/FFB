import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { 
  RefreshCw, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Configuration for ServiceNow
const SN_INSTANCE = 'https://accelareincdemo7.service-now.com'
const AUTH = btoa('gautham_api_interface:AccelareDemo7#')

export function EventsHistoryPage2() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchONTData = useCallback(async () => {
    setLoading(true)
    try {
      // Filtering for source=ONTData specifically
      const query = 'source=ONTData^ORDERBYDESCsys_updated_on'
      const response = await fetch(
        `${SN_INSTANCE}/api/now/table/em_event?sysparm_query=${encodeURIComponent(query)}`,
        { headers: { 'Authorization': `Basic ${AUTH}`, 'Accept': 'application/json' } }
      )
      const data = await response.json()
      setEvents(data.result || [])
    } catch (err) {
      console.error("Failed to fetch ONT Event data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchONTData()
  }, [fetchONTData])

  // Intelligence Analytics
  const summary = useMemo(() => {
    const isNew = (e: any) => e.resolution_state === 'New' || e.resolution_state === '0'
    const open = events.filter(isNew).length
    const resolved = events.length - open
    
    return {
      total: events.length,
      open,
      resolved,
      criticalCount: events.filter(e => e.severity === '1').length
    }
  }, [events])

  const chartData = [
    { name: 'Unresolved', value: summary.open, color: '#f43f5e' }, // Rose 500
    { name: 'Resolved', value: summary.resolved, color: '#10b981' }, // Emerald 500
  ]

  return (
    <main className="mx-auto flex w-full max-w-[1760px] flex-col gap-6 px-4 py-6">
      {/* Header & Controls */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ONT Event Intelligence</h1>
          <p className="text-sm text-slate-500">Real-time health monitoring and resolution tracking for Finley Network nodes.</p>
        </div>
        <button 
          onClick={fetchONTData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh Feed
        </button>
      </header>

      {/* KPI Section */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total ONT Events" value={summary.total} icon={<Activity className="text-blue-500" />} />
        <StatCard label="New / Unresolved" value={summary.open} icon={<AlertCircle className="text-rose-500" />} trend="Requires Action" />
        <StatCard label="System Resolved" value={summary.resolved} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard label="Critical Severity" value={summary.criticalCount} icon={<ShieldAlert className="text-orange-500" />} />
      </section>

      {/* Charts Section */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="fc-panel p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Resolution Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6">
             {chartData.map(item => (
               <div key={item.name} className="flex items-center gap-2">
                 <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                 <span className="text-xs font-medium text-slate-600">{item.name}: {item.value}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="fc-panel p-6 shadow-sm lg:col-span-2">
           <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Trend Analysis</h3>
           <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={events.slice(0, 15).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="node" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="severity" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
           </div>
           <p className="mt-4 text-center text-xs text-slate-400">Visualization of severity distribution across the last 15 detected nodes.</p>
        </div>
      </section>

      {/* Main Events Table */}
      <section className="fc-panel overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 px-6 py-4 border-b">
          <h3 className="font-bold text-slate-800">Telemetry Feed: cmdb_ci_ni_telco_equipment</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4">Network Device (Node)</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Alert Triggered</th>
                <th className="px-6 py-4">Resolution State</th>
                <th className="px-6 py-4 text-right">Timestamp (Updated)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {events.map((event) => {
                const isNew = event.resolution_state === 'New' || event.resolution_state === '0';
                return (
                  <tr key={event.sys_id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isNew ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                      )} />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{event.node}</td>
                    <td className="px-6 py-4 max-w-xs relative group/tip">
                                {/* The visible cropped text */}
                                <div className="truncate text-slate-600 cursor-help" title={event.description}>
                                    {event.description}
                                </div>

                                {/* Custom Floating Tooltip (Optional: Use this if you want a styled UI instead of the browser default) */}
                                <div className="absolute z-50 invisible group-hover/tip:visible bg-slate-800 text-white text-xs p-2 rounded shadow-xl -top-8 left-6 w-64 pointer-events-none">
                                    {event.description}
                                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 rotate-45" />
                                </div>
                                </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-slate-50 font-medium text-slate-600">
                        {event.type || 'System Event'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                       {event.alert ? (
                         <span className="inline-flex items-center gap-1 text-sky-600 font-bold">
                           Yes <ExternalLink className="h-3 w-3" />
                         </span>
                       ) : <span className="text-slate-400">No</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tighter",
                        isNew ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {event.resolution_state || 'Processed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-[11px] text-slate-400">
                      {event.sys_updated_on}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, icon, trend }: { label: string; value: number | string; icon: React.ReactNode; trend?: string }) {
  return (
    <div className="fc-panel p-5 shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <h4 className="text-3xl font-bold tracking-tight text-slate-900">{value}</h4>
        {trend && <span className="text-[10px] font-bold text-rose-500 uppercase">{trend}</span>}
      </div>
    </div>
  )
}