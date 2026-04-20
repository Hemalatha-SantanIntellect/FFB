import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Asset, AssetStatus } from '@/data/mockData'
import { threatLevelBadgeClass } from '@/lib/severityChips'
import { cn } from '@/lib/utils'

function statusBadgeClass(status: AssetStatus) {
  switch (status) {
    case 'healthy':
      return 'border-emerald-200/90 bg-emerald-50/95 text-emerald-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]'
    case 'warning':
      return 'border-amber-200/90 bg-amber-50/95 text-amber-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]'
    case 'critical':
    default:
      return 'border-rose-200/90 bg-rose-50/95 text-rose-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]'
  }
}

type OperationalInfoProps = {
  asset: Asset
}

export function OperationalInfo({ asset }: OperationalInfoProps) {
  return (
    <Card className="fc-panel">
      <CardHeader className="pb-2">
        <CardTitle className="fc-section-title">
          Asset record
        </CardTitle>
        <p className="fc-eyebrow">
          Operations
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-slate-700">{asset.id}</p>
            <p className="text-[13px] font-semibold leading-snug text-slate-900">{asset.name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-600">{asset.assetType}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'border text-[10px] font-semibold capitalize',
              statusBadgeClass(asset.status),
            )}
          >
            {asset.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Firmware
            </p>
            <p className="mt-0.5 font-semibold text-slate-900">{asset.firmware}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Last seen
            </p>
            <p className="mt-0.5 font-semibold text-slate-900">{asset.lastSeen}</p>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        <div>
          <p className="fc-eyebrow">
            Risk
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
            <div>
              <dt className="font-semibold text-slate-600">Threat</dt>
              <dd className="mt-1.5">
                <Badge
                  variant="default"
                  className={cn(
                    'rounded-md px-2 text-[10px] font-semibold uppercase',
                    threatLevelBadgeClass(asset.threatLevel),
                  )}
                >
                  {asset.threatLevel}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Owner</dt>
              <dd className="font-semibold text-slate-900">{asset.manager}</dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}
