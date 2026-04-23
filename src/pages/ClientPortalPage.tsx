import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  BellRing,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { buildRouteSnapshot } from '@/lib/routeMetrics'

type ClientPortalPageProps = {
  selectedRoute: string
}

type TrendPoint = {
  label: string
  valueA: number
  valueB: number
}

type InsightItem = {
  id: string
  title: string
  description: string
  cta: string
  icon: ReactNode
  accent: string
  resultMessage: string
}

function monthLabels(count: number) {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' })
  const labels: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(formatter.format(d))
  }
  return labels
}

function buildTrendSeries({
  labels,
  startA,
  endA,
  startB,
  endB,
}: {
  labels: string[]
  startA: number
  endA: number
  startB: number
  endB: number
}): TrendPoint[] {
  if (labels.length === 0) return []
  if (labels.length === 1) {
    return [{ label: labels[0], valueA: Math.round(startA), valueB: Math.round(startB) }]
  }
  return labels.map((label, index) => {
    const t = index / (labels.length - 1)
    const wave = Math.sin(index * 1.2) * 2.2
    const valueA = Math.max(0, Math.round(startA + (endA - startA) * t + wave))
    const valueB = Math.max(0, Math.round(startB + (endB - startB) * t - wave))
    return { label, valueA, valueB }
  })
}

export function ClientPortalPage({ selectedRoute }: ClientPortalPageProps) {
  const [activeInsight, setActiveInsight] = useState<InsightItem | null>(null)
  const [insightRuns, setInsightRuns] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState<{ title: string; detail: string } | null>(null)

  const snapshot = useMemo(() => buildRouteSnapshot(selectedRoute), [selectedRoute])

  const portalData = useMemo(() => {
    const networkHealth = Math.round((snapshot.networkAvailability * 0.5 + snapshot.avgFundingHealth * 0.5) * 10) / 10
    const impactedUsers = snapshot.critical * 42 + snapshot.high * 26 + snapshot.medium * 12
    const openCases = snapshot.status.critical + snapshot.status.warning + snapshot.securityEvents.length
    const avgEtaHours = Math.max(
      1,
      Number((snapshot.critical * 0.9 + snapshot.high * 1.8 + snapshot.medium * 2.5 + 1.4).toFixed(1)),
    )

    const complianceHealth = Math.round((snapshot.complianceValidation + snapshot.weightedSecurity) / 2)

    const monthlyLabels = monthLabels(7)
    const bandwidthTrend = buildTrendSeries({
      labels: monthlyLabels,
      startA: 52 + snapshot.low,
      endA: 56 + snapshot.high,
      startB: 24 + snapshot.medium,
      endB: 15 + snapshot.critical,
    })
    const outageTrend = buildTrendSeries({
      labels: monthlyLabels,
      startA: 5 + snapshot.medium,
      endA: 10 + snapshot.high,
      startB: 2 + snapshot.critical,
      endB: 8 + snapshot.high + snapshot.critical,
    })
    const environmentTrend = buildTrendSeries({
      labels: monthlyLabels,
      startA: 43 + snapshot.medium,
      endA: 56 + snapshot.high,
      startB: 47 + snapshot.medium,
      endB: 60 + snapshot.critical,
    })

    const invoiceTotalDue = Math.round(
      snapshot.routeAssetTotal * 125 + openCases * 210 + (100 - snapshot.avgFundingHealth) * 36,
    )
    const securityReportCount = Math.max(Math.round(snapshot.weightedSecurity / 15), 4)
    const capacityAlertLabel =
      snapshot.critical + snapshot.high > 0
        ? `${snapshot.critical + snapshot.high} node segments above threshold`
        : 'No major capacity risks detected'

    return {
      totalAssets: snapshot.fundingTotal,
      networkHealth,
      impactedUsers,
      openCases,
      avgEtaHours,
      invoiceTotalDue,
      complianceHealth,
      securityReportCount,
      capacityAlertLabel,
      bandwidthTrend,
      outageTrend,
      environmentTrend,
      criticalCount: snapshot.critical,
      highCount: snapshot.high,
    }
  }, [snapshot])

  const insights = useMemo<InsightItem[]>(
    () => [
      {
        id: 'case-timeline',
        title: 'Case resolution timeline',
        description: `${portalData.openCases} active cases are tracked against route-level ETA and restoration milestones.`,
        cta: 'Review timeline',
        icon: <CheckCircle2 className="h-4 w-4 text-slate-700" />,
        accent: 'border-slate-200 bg-white',
        resultMessage: 'Case timeline refreshed with current milestones and owner updates.',
      },
      {
        id: 'billing-impact',
        title: 'Billing impact review',
        description: `$${portalData.invoiceTotalDue.toLocaleString()} in scope is now tied to service impact and invoice adjustments.`,
        cta: 'Open billing review',
        icon: <Wrench className="h-4 w-4 text-emerald-700" />,
        accent: 'border-emerald-200 bg-emerald-50/60',
        resultMessage: 'Billing impact package generated for client-facing review.',
      },
      {
        id: 'service-advisories',
        title: 'Planned service advisories',
        description: `${portalData.criticalCount + portalData.highCount} high-priority events are mapped into proactive advisories.`,
        cta: 'Publish advisories',
        icon: <AlertTriangle className="h-4 w-4 text-amber-700" />,
        accent: 'border-amber-200 bg-amber-50/70',
        resultMessage: 'Client advisory bulletin prepared for upcoming service windows.',
      },
      {
        id: 'compliance-requests',
        title: 'Compliance & audit requests',
        description: `${portalData.securityReportCount} audit packs are ready for this route scope.`,
        cta: 'Generate attestation',
        icon: <FileCheck2 className="h-4 w-4 text-sky-700" />,
        accent: 'border-sky-200 bg-sky-50/70',
        resultMessage: 'Compliance evidence bundle generated and attached to requests.',
      },
      {
        id: 'sla-recovery',
        title: 'SLA recovery actions',
        description: `${portalData.networkHealth}% network health is being pushed upward through targeted recovery workflows.`,
        cta: 'Run SLA recovery',
        icon: <BellRing className="h-4 w-4 text-rose-700" />,
        accent: 'border-rose-200 bg-rose-50/70',
        resultMessage: 'SLA recovery actions executed and linked to open support cases.',
      },
    ],
    [portalData],
  )

  function runInsight(item: InsightItem) {
    setInsightRuns((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))
    setFeedback({
      title: item.title,
      detail: item.resultMessage,
    })
  }

  useEffect(() => {
    if (!feedback) return
    const id = window.setTimeout(() => setFeedback(null), 2400)
    return () => window.clearTimeout(id)
  }, [feedback])

  return (
    <main className="mx-auto flex w-full max-w-[1760px] flex-col gap-4 px-3 py-4 sm:px-5 sm:py-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Subscribed network health"
          value={`${portalData.networkHealth}%`}
          subtitle="Operational"
          icon={<Activity className="h-4 w-4 text-emerald-700" />}
        />
        <MetricCard
          title="Active service impact"
          value={String(portalData.impactedUsers)}
          subtitle="End-users impacted"
          icon={<Users className="h-4 w-4 text-rose-700" />}
        />
        <MetricCard
          title="Open support cases"
          value={String(portalData.openCases)}
          subtitle={`Active (Avg. ETA ${portalData.avgEtaHours}h)`}
          icon={<Wrench className="h-4 w-4 text-amber-700" />}
        />
        <MetricCard
          title="E-billing & invoice summaries"
          value={`$${portalData.invoiceTotalDue.toLocaleString()}`}
          subtitle="Total due"
          icon={<BadgeDollarSign className="h-4 w-4 text-sky-700" />}
        />
        <MetricCard
          title="Data privacy & compliance health"
          value={`${portalData.complianceHealth}%`}
          subtitle="Validated"
          icon={<ShieldCheck className="h-4 w-4 text-indigo-700" />}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <TrendCard
          title="Bandwidth utilization trends"
          description="Traffic vs degradation"
          data={portalData.bandwidthTrend}
          lineA="#0f766e"
          lineB="#1d4ed8"
          labelA="Traffic spikes"
          labelB="Optical degradation"
        />
        <TrendCard
          title="Historical outage impact"
          description="Response vs breach pressure"
          data={portalData.outageTrend}
          lineA="#92400e"
          lineB="#b91c1c"
          labelA="Time-to-resolution"
          labelB="Breach threshold"
        />
        <TrendCard
          title="Environmental threat exposure"
          description="Temperature vs moisture"
          data={portalData.environmentTrend}
          lineA="#166534"
          lineB="#a16207"
          labelA="Temperature"
          labelB="Moisture ingress"
        />
      </section>

      <section className="fc-panel p-3 sm:p-4">
        <p className="fc-eyebrow mb-3">Client service orchestration</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {insights.map((item) => (
            <ActionTile
              key={item.id}
              title={item.title}
              description={item.description}
              cta={item.cta}
              icon={item.icon}
              accent={item.accent}
              runCount={insightRuns[item.id] ?? 0}
              onRun={() => runInsight(item)}
              onDetails={() => setActiveInsight(item)}
            />
          ))}
        </div>
      </section>

      {activeInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Insight Control
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{activeInsight.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{activeInsight.description}</p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Executed {insightRuns[activeInsight.id] ?? 0} times in this session.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setActiveInsight(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                onClick={() => {
                  runInsight(activeInsight)
                  setActiveInsight(null)
                }}
              >
                Execute Action
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 shadow-lg">
          <p className="text-[11px] font-semibold text-emerald-800">{feedback.title}</p>
          <p className="mt-1 text-[11px] text-emerald-700">{feedback.detail}</p>
        </div>
      )}
    </main>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: ReactNode
}) {
  return (
    <div className="fc-panel flex items-start gap-3 px-4 py-3.5">
      <div className="mt-0.5 rounded-md border border-slate-200 bg-slate-50 p-2">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        <p className="text-[12px] font-medium text-slate-600">{subtitle}</p>
      </div>
    </div>
  )
}

function TrendCard({
  title,
  description,
  data,
  lineA,
  lineB,
  labelA,
  labelB,
}: {
  title: string
  description: string
  data: TrendPoint[]
  lineA: string
  lineB: string
  labelA: string
  labelB: string
}) {
  return (
    <div className="fc-panel p-3">
      <div className="mb-2">
        <p className="text-[12px] font-semibold text-slate-900">{title}</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{description}</p>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={34} />
            <Tooltip
              cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                boxShadow: '0 8px 20px -12px rgba(15, 23, 42, 0.55)',
              }}
            />
            <Line type="monotone" dataKey="valueA" stroke={lineA} strokeWidth={2.2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="valueB" stroke={lineB} strokeWidth={2.2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lineA }} />
          {labelA}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lineB }} />
          {labelB}
        </span>
      </div>
    </div>
  )
}

function ActionTile({
  title,
  description,
  cta,
  icon,
  accent,
  runCount,
  onRun,
  onDetails,
}: {
  title: string
  description: string
  cta: string
  icon: ReactNode
  accent: string
  runCount: number
  onRun: () => void
  onDetails: () => void
}) {
  return (
    <div className={`rounded-lg border p-3 ${accent}`}>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <p className="text-[11px] font-semibold text-slate-900">{title}</p>
      </div>
      <p className="min-h-[50px] text-[11px] leading-relaxed text-slate-600">{description}</p>
      <p className="mt-2 text-[10px] font-medium text-slate-500">Run count: {runCount}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:bg-slate-50"
          onClick={onRun}
        >
          {cta}
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:bg-slate-100"
          onClick={onDetails}
        >
          Details
        </button>
      </div>
    </div>
  )
}
