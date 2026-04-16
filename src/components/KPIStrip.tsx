import { Activity, Bell, ShieldCheck, Users } from 'lucide-react'

export type KPIStripProps = {
  monitored: number
  avgHealth: number
  avgSecurity: number
  warningCount: number
  criticalCount: number
  alertCount: number
}

export function KPIStrip({
  monitored,
  avgHealth,
  avgSecurity,
  warningCount,
  criticalCount,
  alertCount,
}: KPIStripProps) {
  const items = [
    {
      title: 'Monitored assets',
      value: String(monitored),
      subtitle: 'Active network nodes',
      icon: Users,
      accent: 'border-l-sky-400 bg-sky-50/40',
      iconClass: 'text-sky-600',
    },
    {
      title: 'Average health',
      value: `${avgHealth}%`,
      subtitle: `${warningCount} warning assets`,
      icon: Activity,
      accent: 'border-l-sky-400 bg-sky-50/40',
      iconClass: 'text-sky-600',
    },
    {
      title: 'Security score',
      value: `${avgSecurity}%`,
      subtitle: `${criticalCount} critical assets`,
      icon: ShieldCheck,
      accent: 'border-l-sky-400 bg-sky-50/40',
      iconClass: 'text-sky-600',
    },
    {
      title: 'Live alerts',
      value: String(alertCount),
      subtitle: 'Security feed',
      icon: Bell,
      accent: 'border-l-sky-400 bg-sky-50/40',
      iconClass: 'text-sky-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-neutral-200/70 bg-neutral-200/50 md:grid-cols-4">
      {items.map(({ title, value, subtitle, icon: Icon, accent, iconClass }) => (
        <div
          key={title}
          className={`flex items-start gap-3 border-l-[3px] px-4 py-3.5 ${accent}`}
        >
          <Icon
            className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`}
            strokeWidth={1.5}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
              {title}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-neutral-900">
              {value}
            </p>
            <p className="text-[11px] font-medium text-neutral-700">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
