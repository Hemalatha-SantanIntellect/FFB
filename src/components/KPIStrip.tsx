import { Activity, Bell, ShieldCheck, Users } from 'lucide-react'

export type KPIStripProps = {
  monitored: number
  avgHealth: number
  warningCount: number
  criticalCount: number
  avgSecurity: number
  alertCount: number
}

export function KPIStrip({
  monitored,
  avgHealth,
  warningCount,
  criticalCount,
  avgSecurity,
  alertCount,
}: KPIStripProps) {
  const items = [
    {
      title: 'Monitored assets',
      value: String(monitored),
      subtitle: 'Active network nodes',
      icon: Users,
      accent: 'border-l-sky-500 bg-sky-50/55',
      iconClass: 'text-sky-700',
    },
    {
      title: 'Average health',
      value: `${avgHealth}%`,
      subtitle: `${warningCount} warning assets`,
      icon: Activity,
      accent: 'border-l-sky-500 bg-sky-50/55',
      iconClass: 'text-sky-700',
    },
    {
      title: 'Security score',
      value: `${avgSecurity}%`,
      subtitle: `${criticalCount} critical assets`,
      icon: ShieldCheck,
      accent: 'border-l-sky-500 bg-sky-50/55',
      iconClass: 'text-sky-700',
    },
    {
      title: 'Live alerts',
      value: String(alertCount),
      subtitle: 'Security feed',
      icon: Bell,
      accent: 'border-l-sky-500 bg-sky-50/55',
      iconClass: 'text-sky-700',
    },
  ]

  return (
    <div className="fc-panel grid grid-cols-1 gap-px overflow-hidden border-slate-200/80 bg-slate-100/70 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ title, value, subtitle, icon: Icon, accent, iconClass }) => (
        <div
          key={title}
          className={`flex items-start gap-3 border-l-[3px] px-4 py-3.5 transition-colors hover:bg-white/80 ${accent}`}
        >
          <Icon
            className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`}
            strokeWidth={1.5}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {title}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-slate-900">
              {value}
            </p>
            <p className="text-[11px] font-medium text-slate-700">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}