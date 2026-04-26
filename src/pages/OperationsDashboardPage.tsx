import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Activity, CheckCircle2, ShieldCheck, Users, Wrench } from 'lucide-react'

import { AssetHealthPanel2 } from '@/components/AssetHealthPanel2'
import { Badge } from '@/components/ui/badge'
import { GeoMapPanel2 } from '@/components/GeoMapPanel2'
import { GeoMapPanel3D } from '@/components/GeoMap3D'
import { KPIStrip } from '@/components/KPIStrip'
import { SecurityPosture } from '@/components/SecurityPosture'
import { SensorHealthStrip } from '@/components/SensorHealthStrip'
import { AgentConfigModal } from '@/components/AgentConfigModal'
import fundingData from '@/data/fin_funding.json'
import { fundingMatchesRouteFilter } from '@/lib/assetFilters'
import { buildRouteSnapshot } from '@/lib/routeMetrics'
import { eventSeverityBadgeClass } from '@/lib/severityChips'
import { cn } from '@/lib/utils'
import {ArcGISMap} from './map_comp'

const SECURITY_POSTURE_LEGEND = [
  { label: '≥80%', swatch: 'bg-emerald-500', title: 'Strong' },
  { label: '65–79%', swatch: 'bg-sky-500', title: 'Good' },
  { label: '50–64%', swatch: 'bg-amber-500', title: 'Watch' },
  { label: '<50%', swatch: 'bg-rose-500', title: 'At risk' },
] as const

type OperationsDashboardPageProps = {
  selectedRoute: string
}

type OpsWorkflow = {
  id: string
  title: string
  description: string
  cta: string
  icon: ReactNode
  accent: string
  resultMessage: string
}

export function OperationsDashboardPage({ selectedRoute }: OperationsDashboardPageProps) {
  const scopedFundingAssets = useMemo<Record<string, unknown>[]>(
    () =>
      Object.entries(fundingData as Record<string, Record<string, unknown>[]>).flatMap(([category, items]) =>
        items
          .filter((item) => fundingMatchesRouteFilter(item as { exchange?: string | null; serving_area?: string | null }, selectedRoute))
          .map((item) => ({ ...(item as Record<string, unknown>), category })),
      ),
    [selectedRoute],
  )

  const [selectedAsset, setSelectedAsset] = useState<Record<string, unknown> | null>(null)
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D')
  const [activeWorkflow, setActiveWorkflow] = useState<OpsWorkflow | null>(null)
  const [workflowRuns, setWorkflowRuns] = useState<Record<string, number>>({})
  const [workflowFeedback, setWorkflowFeedback] = useState<{ title: string; detail: string } | null>(null)

  const snapshot = useMemo(() => buildRouteSnapshot(selectedRoute), [selectedRoute])
  const workflows = useMemo<OpsWorkflow[]>(
    () => [
      {
        id: 'triage',
        title: 'Incident triage queue',
        description: `${snapshot.critical + snapshot.high} high-priority incidents require immediate triage and owner assignment.`,
        cta: 'Open triage queue',
        icon: <Activity className="h-4 w-4 text-rose-700" />,
        accent: 'border-rose-200 bg-rose-50/70',
        resultMessage: 'Incident triage queue refreshed and reprioritized by route severity.',
      },
      {
        id: 'maintenance',
        title: 'Maintenance window planner',
        description: `${snapshot.status.warning} warning assets are queued for coordinated maintenance windows.`,
        cta: 'Plan windows',
        icon: <Wrench className="h-4 w-4 text-amber-700" />,
        accent: 'border-amber-200 bg-amber-50/70',
        resultMessage: 'Maintenance windows generated and aligned with field availability.',
      },
      {
        id: 'remediation',
        title: 'Asset risk remediation',
        description: `${snapshot.status.critical} critical assets are mapped to remediation and replacement workflows.`,
        cta: 'Start remediation',
        icon: <ShieldCheck className="h-4 w-4 text-sky-700" />,
        accent: 'border-sky-200 bg-sky-50/70',
        resultMessage: 'Risk remediation sequence started for critical route assets.',
      },
      {
        id: 'dispatch',
        title: 'Field dispatch console',
        description: `${snapshot.routeAssetTotal} in-scope assets can be dispatched to crews with route-aware priorities.`,
        cta: 'Dispatch field team',
        icon: <Users className="h-4 w-4 text-emerald-700" />,
        accent: 'border-emerald-200 bg-emerald-50/70',
        resultMessage: 'Dispatch package sent to field operations with updated route priorities.',
      },
      {
        id: 'verification',
        title: 'Post-action verification',
        description: `Current network health ${snapshot.avgFundingHealth}% requires validation checks after every action cycle.`,
        cta: 'Run verification',
        icon: <CheckCircle2 className="h-4 w-4 text-slate-700" />,
        accent: 'border-slate-200 bg-white',
        resultMessage: 'Post-action verification checklist completed for in-scope assets.',
      },
    ],
    [snapshot],
  )

  useEffect(() => {
    if (scopedFundingAssets.length === 0) {
      setSelectedAsset(null)
      return
    }
    setSelectedAsset((prev) => {
      if (!prev) return scopedFundingAssets[0]
      const prevRid = String(prev.rid ?? '')
      const stillVisible = scopedFundingAssets.some((a) => String(a.rid ?? '') === prevRid)
      return stillVisible ? prev : scopedFundingAssets[0]
    })
  }, [scopedFundingAssets])

  useEffect(() => {
    if (!workflowFeedback) return
    const id = window.setTimeout(() => setWorkflowFeedback(null), 2400)
    return () => window.clearTimeout(id)
  }, [workflowFeedback])

  function runWorkflow(workflow: OpsWorkflow) {
    setWorkflowRuns((prev) => ({ ...prev, [workflow.id]: (prev[workflow.id] ?? 0) + 1 }))
    setWorkflowFeedback({
      title: workflow.title,
      detail: workflow.resultMessage,
    })
  }
  void workflows
  void OpsWorkflowTile

  return (
    <>
      <main className="mx-auto flex w-full max-w-[1760px] flex-col gap-4 px-3 py-4 sm:px-5 sm:py-5">
        <KPIStrip
          monitored={snapshot.fundingTotal}
          avgHealth={snapshot.avgFundingHealth}
          warningCount={snapshot.medium}
          criticalCount={snapshot.critical + snapshot.high}
          avgSecurity={snapshot.averages.security}
          alertCount={snapshot.securityEvents.length}
        />

        <section className="flex flex-col gap-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
            {mapMode === '3D' ? (
              <GeoMapPanel3D
                selectedRoute={selectedRoute}
                mapMode={mapMode}
                onMapModeChange={setMapMode}
              />
            ) : (
              <GeoMapPanel2 mapMode={mapMode} onMapModeChange={setMapMode} />
            )}
            <AssetHealthPanel2 />
          </div>
        </section>

        <ArcGISMap />

        <SensorHealthStrip />

        {/*
        <section className="fc-panel p-3 sm:p-4">
          <p className="fc-eyebrow mb-3">Operational orchestration hub</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {workflows.map((workflow) => (
              <OpsWorkflowTile
                key={workflow.id}
                title={workflow.title}
                description={workflow.description}
                cta={workflow.cta}
                icon={workflow.icon}
                accent={workflow.accent}
                runCount={workflowRuns[workflow.id] ?? 0}
                onRun={() => runWorkflow(workflow)}
                onDetails={() => setActiveWorkflow(workflow)}
              />
            ))}
          </div>
        </section>
        */}

        <section className="fc-panel p-3 sm:p-4">
          <h3 className="fc-eyebrow mb-3 flex items-center gap-2 text-[11px]">
            <ShieldCheck className="h-4 w-4 text-sky-600" />
            Security monitoring metrics
          </h3>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Live threat signals
                </p>
                <p className="text-[11px] font-semibold text-slate-700">{snapshot.securityEvents.length} events</p>
              </div>
              <div className="space-y-2">
                {snapshot.securityEvents.slice(0, 6).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-900">{ev.title}</p>
                      <p className="truncate text-[11px] text-slate-600">{ev.asset}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        className={cn(
                          'rounded-md px-1.5 text-[9px] font-semibold uppercase',
                          eventSeverityBadgeClass(ev.severity),
                        )}
                      >
                        {ev.severity}
                      </Badge>
                      <span className="text-[10px] font-medium text-slate-500">{ev.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Executive snapshot
              </p>
              <div className="space-y-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                  <p className="text-[11px] font-semibold text-slate-900">
                    {String(selectedAsset?.name_as ?? selectedAsset?.rid ?? 'No asset selected')}
                  </p>
                  <p className="text-[10px] text-slate-600">{String(selectedAsset?.category ?? '—')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                    <p className="text-[9px] font-semibold uppercase text-slate-500">Status</p>
                    <p className="text-[11px] font-semibold capitalize text-slate-800">
                      {String(selectedAsset?.lifecycle_state ?? 'Unknown')}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                    <p className="text-[9px] font-semibold uppercase text-slate-500">Threat</p>
                    <p className="text-[11px] font-semibold text-slate-800">
                      {String(selectedAsset?.security_label ?? 'Unknown')}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">Priority actions</p>
                  <ul className="mt-1 space-y-1 text-[11px] text-slate-700">
                    <li>CAB-12 and PED-12 require immediate site inspection.</li>
                    <li>Degradation on TRANS-17 requires preventive maintenance.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fc-panel p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="fc-eyebrow flex items-center gap-2 text-[11px]">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              Security posture
            </h3>
            <div
              className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] font-medium text-slate-600"
              aria-label="Score band legend"
            >
              {SECURITY_POSTURE_LEGEND.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap"
                  title={`${item.title}: ${item.label}`}
                >
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-sm shadow-sm', item.swatch)}
                    aria-hidden
                  />
                  <span className="font-semibold tabular-nums text-slate-700">{item.label}</span>
                </span>
              ))}
            </div>
          </div>
          <SecurityPosture metrics={snapshot.controlMetrics} />
        </section>
      </main>

      {activeWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Operational Workflow
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{activeWorkflow.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{activeWorkflow.description}</p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Executed {workflowRuns[activeWorkflow.id] ?? 0} times in this session.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setActiveWorkflow(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                onClick={() => {
                  runWorkflow(activeWorkflow)
                  setActiveWorkflow(null)
                }}
              >
                Execute Action
              </button>
            </div>
          </div>
        </div>
      )}

      {workflowFeedback && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 shadow-lg">
          <p className="text-[11px] font-semibold text-emerald-800">{workflowFeedback.title}</p>
          <p className="mt-1 text-[11px] text-emerald-700">{workflowFeedback.detail}</p>
        </div>
      )}

      <AgentConfigModal />
    </>
  )
}

function OpsWorkflowTile({
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
      <p className="min-h-[56px] text-[11px] leading-relaxed text-slate-600">{description}</p>
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
