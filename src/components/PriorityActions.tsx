import { AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const statusCard = {
  critical:
    'border-rose-200/90 bg-rose-50/95  shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]',
  warning:
    'border-amber-200/90 bg-amber-50/95  shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]',
} as const

export function PriorityActions() {
  return (
    <div className="fc-panel space-y-2 p-3">
       <CardHeader className="pb-2">
        <CardTitle className="fc-section-title">
          Priority Actions
        </CardTitle>
        <p className="fc-eyebrow">
          Field Follow Up
        </p>
      </CardHeader>
      <Card
        className={cn(
          'overflow-hidden rounded-md border shadow-none',
          statusCard.critical,
        )}
      >
        <CardContent className="flex gap-3 py-3 pt-3">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-rose-700"
            strokeWidth={1.5}
            aria-hidden
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-900">
              Critical
            </p>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-900">
              CAB-12 and PED-12 require immediate site inspection.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card
        className={cn(
          'overflow-hidden rounded-md border shadow-none',
          statusCard.warning,
        )}
      >
        <CardContent className="flex gap-3 py-3 pt-3">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
            strokeWidth={1.5}
            aria-hidden
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-900">
              Warning
            </p>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-900">
              Degradation noted on TRANS-17. Preventive maintenance recommended.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
