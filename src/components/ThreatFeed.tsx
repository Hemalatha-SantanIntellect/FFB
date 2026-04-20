import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { SecurityEvent } from '@/data/mockData'
import { eventSeverityBadgeClass } from '@/lib/severityChips'
import { cn } from '@/lib/utils'

type ThreatFeedProps = {
  events: SecurityEvent[]
}

export function ThreatFeed({ events }: ThreatFeedProps) {
  return (
    <Card className="fc-panel">
      <CardHeader className="pb-2">
        <CardTitle className="fc-section-title">
          Threat feed
        </CardTitle>
        <p className="fc-eyebrow">
          Recent signals
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[200px] pr-3">
          <ul>
            {events.map((ev, i) => (
              <li key={ev.id}>
                {i > 0 ? <Separator className="my-3 bg-slate-100" /> : null}
                <div className="flex gap-2.5">
                  <Badge
                    variant="default"
                    className={cn(
                      'rounded-md px-2 text-[10px] font-semibold uppercase',
                      eventSeverityBadgeClass(ev.severity),
                    )}
                  >
                    {ev.severity}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-snug text-slate-900">
                      {ev.title}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-slate-700">{ev.asset}</p>
                  </div>
                  <time className="shrink-0 text-[11px] font-medium tabular-nums text-slate-500">
                    {ev.timeAgo}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
