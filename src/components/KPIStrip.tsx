import { Activity, Bell, ShieldCheck, Users } from 'lucide-react'
import { useMemo } from 'react'

// Data Imports
import fundingData from '@/data/fin_funding.json'
import sensorData from '@/data/fin_sensor.json'

export type KPIStripProps = {
  // We keep these as props since they still come from the security/threat feed
  avgSecurity: number
  alertCount: number
}

export function KPIStrip({
  avgSecurity,
  alertCount,
}: KPIStripProps) {
  
  const metrics = useMemo(() => {
    // 1. Compute Total Monitored Assets from Funding JSON
    let totalAssets = 0
    Object.values(fundingData).forEach((list: any) => {
      totalAssets += list.length
    })

    // 2. Map sensor health to numeric scores for averaging
    // Critical = 25, High = 50, Medium = 75, Healthy/None = 100
    const healthMap = new Map()
    sensorData.forEach((s) => {
      let score = 100
      if (s.criticality === 'Critical') score = 25
      else if (s.criticality === 'High') score = 50
      else if (s.criticality === 'Medium') score = 75
      healthMap.set(s.sensor_uid, score)
    })

    let totalHealthScore = 0
    let warningCount = 0
    let criticalCount = 0

    // 3. Iterate all assets to find linked sensor health
    Object.values(fundingData).forEach((list: any) => {
      list.forEach((asset: any) => {
        const uid = asset.sensor_metadata?.sensor_uid
        const score = healthMap.get(uid) || 100 // Default to 100 if no sensor or healthy
        
        totalHealthScore += score
        if (score === 75) warningCount++
        if (score <= 50) criticalCount++
      })
    })

    const avgHealth = Math.round(totalHealthScore / totalAssets)

    return {
      monitored: totalAssets,
      avgHealth,
      warningCount,
      criticalCount
    }
  }, [])

  const items = [
    {
      title: 'Monitored assets',
      value: String(metrics.monitored),
      subtitle: 'Active network nodes',
      icon: Users,
      accent: 'border-l-sky-400 bg-sky-50/40',
      iconClass: 'text-sky-600',
    },
    {
      title: 'Average health',
      value: `${metrics.avgHealth}%`,
      subtitle: `${metrics.warningCount} warning assets`,
      icon: Activity,
      accent: 'border-l-sky-400 bg-sky-50/40',
      iconClass: 'text-sky-600',
    },
    {
      title: 'Security score',
      value: `${avgSecurity}%`,
      subtitle: `${metrics.criticalCount} critical assets`,
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
          className={`flex items-start gap-3 border-l-[3px] px-4 py-3.5 transition-colors hover:bg-white/60 ${accent}`}
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