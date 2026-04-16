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
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-none">
       <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-tight text-neutral-900">
          Priority Actions
        </CardTitle>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
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
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-900">
              Critical
            </p>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-neutral-900">
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
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-900">
              Warning
            </p>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-neutral-900">
              Degradation noted on TRANS-17. Preventive maintenance recommended.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
