import { useMemo } from 'react'
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

import { useEvents } from '@/context/EventsContext'

export function EventsHistoryPage() {
  const { events } = useEvents()

  const summary = useMemo(() => {
    const open = events.filter((event) => event.status === 'open').length
    const fixed = events.filter((event) => event.status === 'fixed').length
    const fixedDurations = events
      .filter((event) => event.status === 'fixed' && event.fixedAt)
      .map((event) => {
        const start = new Date(event.createdAt).getTime()
        const end = new Date(event.fixedAt as string).getTime()
        return Math.max(0, Math.round((end - start) / 60000))
      })
    const avgResolveMins =
      fixedDurations.length > 0
        ? Math.round(fixedDurations.reduce((sum, value) => sum + value, 0) / fixedDurations.length)
        : 0
    return { total: events.length, open, fixed, avgResolveMins }
  }, [events])

  const statusChartData = useMemo(
    () => [
      { name: 'Open', value: summary.open, color: '#ef4444' },
      { name: 'Fixed', value: summary.fixed, color: '#10b981' },
    ],
    [summary.fixed, summary.open],
  )

  const categoryChartData = useMemo(() => {
    const counts = new Map<string, number>()
    events.forEach((event) => counts.set(event.category, (counts.get(event.category) ?? 0) + 1))
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [events])

  const timelineData = useMemo(() => {
    const labels = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - idx))
      return d
    })
    const formatKey = (date: Date) => date.toISOString().slice(0, 10)
    const byDay = new Map<string, { day: string; created: number; fixed: number }>()
    labels.forEach((date) => {
      const key = formatKey(date)
      byDay.set(key, {
        day: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        created: 0,
        fixed: 0,
      })
    })
    events.forEach((event) => {
      const createdKey = formatKey(new Date(event.createdAt))
      const createdRow = byDay.get(createdKey)
      if (createdRow) createdRow.created += 1

      if (event.fixedAt) {
        const fixedKey = formatKey(new Date(event.fixedAt))
        const fixedRow = byDay.get(fixedKey)
        if (fixedRow) fixedRow.fixed += 1
      }
    })
    return Array.from(byDay.values())
  }, [events])

  const chartTotals = useMemo(() => {
    const created = timelineData.reduce((sum, row) => sum + row.created, 0)
    const fixed = timelineData.reduce((sum, row) => sum + row.fixed, 0)
    return { created, fixed }
  }, [timelineData])

  return (
    <main className="mx-auto flex w-full max-w-[1760px] flex-col gap-4 px-3 py-4 sm:px-5 sm:py-5">
      <section className="fc-panel p-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">Events History</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <SummaryCard label="Total events" value={summary.total} />
          <SummaryCard label="Open" value={summary.open} />
          <SummaryCard label="Fixed" value={summary.fixed} />
          <SummaryCard label="Avg resolve (min)" value={summary.avgResolveMins} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {categoryChartData.slice(0, 4).map((item) => (
            <SummaryCard key={item.category} label={item.category} value={item.count} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="fc-panel p-3">
          <p className="mb-2 text-[12px] font-semibold text-slate-900">Open vs fixed</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={84}
                  label={({ value }) => String(value)}
                >
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-700">
            {statusChartData.map((entry) => (
              <span key={entry.name} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}: {entry.value}
              </span>
            ))}
          </div>
        </div>

        <div className="fc-panel p-3 lg:col-span-2">
          <p className="mb-2 text-[12px] font-semibold text-slate-900">Event activity (last 7 days)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={34} />
                <Tooltip />
                <Line type="monotone" dataKey="created" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="fixed" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-5 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              Created: {chartTotals.created}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Fixed: {chartTotals.fixed}
            </span>
          </div>
        </div>
      </section>

      <section className="fc-panel overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Asset</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Fixed</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No events found in history.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          event.status === 'open'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{event.assetRid}</td>
                    <td className="px-4 py-3 text-slate-700">{event.category}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(event.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {event.fixedAt ? new Date(event.fixedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}
