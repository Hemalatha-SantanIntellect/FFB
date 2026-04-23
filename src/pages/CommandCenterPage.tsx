import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  Gauge,
  LockKeyhole,
  Megaphone,
  ShieldCheck,
  Siren,
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

type CommandCenterPageProps = {
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

function percent(part: number, total: number) {
  if (total <= 0) return 0
  return (part / total) * 100
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
    const wave = Math.sin(index * 1.22) * 2.9
    const valueA = Math.max(0, Math.round(startA + (endA - startA) * t + wave))
    const valueB = Math.max(0, Math.round(startB + (endB - startB) * t - wave))
    return { label, valueA, valueB }
  })
}

export function CommandCenterPage({ selectedRoute }: CommandCenterPageProps) {
  const [activeInsight, setActiveInsight] = useState<InsightItem | null>(null)
  const [insightRuns, setInsightRuns] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState<{ title: string; detail: string } | null>(null)

  const snapshot = useMemo(() => buildRouteSnapshot(selectedRoute), [selectedRoute])

  const metrics = useMemo(() => {
    const assetTotal = snapshot.routeAssetTotal || 1
    const uptimeRaw = 99 + percent(snapshot.inService, Math.max(snapshot.fundingTotal, 1)) / 1000
    const uptime = Math.min(99.999, Math.max(99.2, uptimeRaw))
    const capacityUtilization = Math.max(
      52,
      Math.min(96, 68 + Math.round(percent(snapshot.high + snapshot.critical, Math.max(snapshot.fundingTotal, 1)) / 4)),
    )
    const ftfr = Math.max(72, Math.min(98, Math.round(percent(snapshot.status.healthy, assetTotal))))
    const securityScore = snapshot.weightedSecurity
    const endpointTrust = Math.max(
      70,
      Math.min(99, Math.round((snapshot.averages.security + percent(snapshot.status.healthy, assetTotal)) / 2)),
    )

    const totalDeployed = snapshot.fundingTotal * 112 + snapshot.routeAssetTotal * 16
    const activeSubscribers = Math.round(totalDeployed * (0.64 + endpointTrust / 500))

    const labels = monthLabels(7)
    const outageTrend = buildTrendSeries({
      labels,
      startA: 36 - Math.min(snapshot.status.warning, 8),
      endA: 22 + snapshot.critical,
      startB: 19 + snapshot.status.warning,
      endB: 13 + snapshot.critical,
    })
    const slaRiskTrend = buildTrendSeries({
      labels,
      startA: 4 + snapshot.medium,
      endA: 14 + snapshot.high,
      startB: 3 + snapshot.critical,
      endB: 11 + snapshot.critical + snapshot.high,
    })
    const patchVelocityTrend = buildTrendSeries({
      labels,
      startA: 32 + snapshot.medium,
      endA: 66 + snapshot.high + snapshot.critical,
      startB: 16 + snapshot.medium,
      endB: 48 + snapshot.high,
    })

    return {
      uptime,
      critical: snapshot.critical,
      high: snapshot.high,
      medium: snapshot.medium,
      ftfr,
      capacityUtilization,
      securityScore,
      endpointTrust,
      totalDeployed,
      activeSubscribers,
      outageTrend,
      slaRiskTrend,
      patchVelocityTrend,
      riskPoints: snapshot.critical * 4 + snapshot.high * 3 + snapshot.medium * 2 + snapshot.low,
      warningAssets: snapshot.status.warning,
      criticalAssets: snapshot.status.critical,
    }
  }, [snapshot])

  const insights = useMemo<InsightItem[]>(
    () => [
      {
        id: 'playbooks',
        title: 'Policy-driven auto remediation',
        description: 'Automation policies execute the right remediation sequence based on incident severity and route context.',
        cta: 'Execute remediation',
        icon: <Bot className="h-4 w-4 text-slate-700" />,
        accent: 'border-slate-200 bg-white',
        resultMessage: 'Autonomous restoration playbook dispatched to active route incidents.',
      },
      {
        id: 'zero-trust',
        title: 'Zero-trust enforcement queue',
        description: `${metrics.critical + metrics.high} high-risk nodes are eligible for automated identity and access tightening.`,
        cta: 'Apply enforcement',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-700" />,
        accent: 'border-emerald-200 bg-emerald-50/65',
        resultMessage: 'Zero-trust policy rollout applied to prioritized endpoint groups.',
      },
      {
        id: 'threat-to-ticket',
        title: 'Threat-to-ticket automation',
        description: `${metrics.critical + metrics.high + metrics.medium} alarm signals can be auto-converted to operational work orders.`,
        cta: 'Create tickets',
        icon: <AlertTriangle className="h-4 w-4 text-amber-700" />,
        accent: 'border-amber-200 bg-amber-50/75',
        resultMessage: 'Threat events translated into actionable operations tickets.',
      },
      {
        id: 'capacity-optimization',
        title: 'Capacity optimization engine',
        description: `${metrics.warningAssets + metrics.criticalAssets} stressed nodes are evaluated for pre-emptive scaling decisions.`,
        cta: 'Run optimizer',
        icon: <LockKeyhole className="h-4 w-4 text-sky-700" />,
        accent: 'border-sky-200 bg-sky-50/75',
        resultMessage: 'Capacity optimization recommendations pushed to planning board.',
      },
      {
        id: 'fp-reduction',
        title: 'False-positive suppression controls',
        description: `Risk model normalized ${metrics.riskPoints} severity points to cut alert fatigue without lowering sensitivity.`,
        cta: 'Tune classifier',
        icon: <Megaphone className="h-4 w-4 text-rose-700" />,
        accent: 'border-rose-200 bg-rose-50/75',
        resultMessage: 'Alert classifier tuning applied to current command-center feed.',
      },
    ],
    [metrics],
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
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          title="Network availability & uptime"
          value={`${metrics.uptime.toFixed(3)}%`}
          subtitle="Operational"
          icon={<Gauge className="h-4 w-4 text-emerald-700" />}
        />
        <KpiCard
          title="Active alarms by severity"
          value={`${metrics.critical + metrics.high + metrics.medium}`}
          subtitle={`${metrics.critical} critical • ${metrics.high} major • ${metrics.medium} minor`}
          icon={<Siren className="h-4 w-4 text-rose-700" />}
        />
        <KpiCard
          title="Field service performance"
          value={`${metrics.ftfr}%`}
          subtitle={`FTFR • Capacity ${metrics.capacityUtilization}%`}
          icon={<Wrench className="h-4 w-4 text-amber-700" />}
        />
        <KpiCard
          title="Security posture score"
          value={`${metrics.securityScore}/100`}
          subtitle="Control maturity"
          icon={<ShieldCheck className="h-4 w-4 text-sky-700" />}
        />
        <KpiCard
          title="IoT endpoint trust score"
          value={`${metrics.endpointTrust}%`}
          subtitle="Device confidence"
          icon={<Cpu className="h-4 w-4 text-indigo-700" />}
        />
        <KpiCard
          title="BEAD buildout progress"
          value={metrics.totalDeployed.toLocaleString()}
          subtitle={`${metrics.activeSubscribers.toLocaleString()} active subscribers`}
          icon={<Users className="h-4 w-4 text-slate-700" />}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <TrendCard
          title="Predictive outage trends"
          description="Power loss vs historical degradation"
          data={metrics.outageTrend}
          lineA="#0f766e"
          lineB="#1d4ed8"
          labelA="Power loss"
          labelB="Historical degradation"
        />
        <TrendCard
          title="SLA breach risks"
          description="Resolution pressure vs breach threshold"
          data={metrics.slaRiskTrend}
          lineA="#1d4ed8"
          lineB="#b91c1c"
          labelA="Time-to-resolution"
          labelB="Breach threshold"
        />
        <TrendCard
          title="Vulnerability patch velocity"
          description="Patch deployment vs MTTR"
          data={metrics.patchVelocityTrend}
          lineA="#166534"
          lineB="#0f766e"
          labelA="Firmware updates"
          labelB="MTTR improvement"
        />
      </section>

      <section className="fc-panel p-3 sm:p-4">
        <p className="fc-eyebrow mb-3">Autonomous command orchestration</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {insights.map((item) => (
            <InsightTile
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
              Command Center Action
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
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 shadow-lg">
          <p className="text-[11px] font-semibold text-sky-800">{feedback.title}</p>
          <p className="mt-1 text-[11px] text-sky-700">{feedback.detail}</p>
        </div>
      )}
    </main>
  )
}

function KpiCard({
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
    <div className="fc-panel flex items-start gap-3 px-3.5 py-3">
      <div className="mt-0.5 rounded-md border border-slate-200 bg-slate-50 p-2">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
        <p className="mt-1 text-[34px] font-semibold leading-none tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-[11px] font-medium text-slate-600">{subtitle}</p>
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
      <div className="mb-1.5">
        <p className="text-[12px] font-semibold text-slate-900">{title}</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{description}</p>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
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

function InsightTile({
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
      <p className="min-h-[66px] text-[11px] leading-relaxed text-slate-600">{description}</p>
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
