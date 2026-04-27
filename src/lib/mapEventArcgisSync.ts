import type { MapEventRecord } from '@/lib/eventsDatabase'
import { syncAddFlagToArcGIS, syncDeleteFlagFromArcGIS } from '@/services/arcgisService'

export type MapEventLocationCandidate = {
  assetRid: string
  assetName: string
  category: string
  longitude: number
  latitude: number
}

type CreateMapEvents = (
  items: (MapEventLocationCandidate & { arcgisFid?: number; eventId?: string })[],
) => void

const SN_INSTANCE = 'https://accelareincdemo7.service-now.com'
const auth = btoa('gautham_api_interface:AccelareDemo7#')

/** ArcGIS + app event records created on each "Create event" run (per press). */
export const MAP_CREATE_EVENT_FLAG_COUNT = 5

/**
 * Picks `count` locations, with replacement if there are not enough unique candidates
 * (so a single run can still create exactly 5 map flags).
 */
function pickRandomCandidates(
  eventCandidates: MapEventLocationCandidate[],
  count: number,
): MapEventLocationCandidate[] {
  if (eventCandidates.length === 0 || count <= 0) return []
  const out: MapEventLocationCandidate[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(eventCandidates[Math.floor(Math.random() * eventCandidates.length)]!)
  }
  return out
}

/**
 * OpenAI + ServiceNow + applyEdits to Event Warning, same as MapLibre 2D map.
 * Optional callback after the hosted layer may have new features (e.g. ArcGIS MapView refresh).
 */
export async function runHealthMonitoringAgentMapFlow(
  eventCandidates: MapEventLocationCandidate[],
  createEvents: CreateMapEvents,
  setCreating: (b: boolean) => void,
  onArcgisMutationComplete?: () => void,
) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim()
  if (!apiKey) {
    await addRandomMapEventsToArcgis(
      eventCandidates,
      createEvents,
      setCreating,
      onArcgisMutationComplete,
      MAP_CREATE_EVENT_FLAG_COUNT,
    )
    return
  }

  setCreating(true)
  console.group('🤖 Health Monitoring Agent: Startup')
  let newEventsForState: (MapEventLocationCandidate & { arcgisFid?: number; eventId?: string })[] = []

  try {
    const aiResponse = await fetch('https://corsproxy.io/?https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              "Generate 5 health monitor events for ONT devices. Format as a JSON array of objects. Fields: node (ONT-Node-001 to ONT-Node-030), type, description, severity (integer 1-5), additional_info: 'Event was created by Health Monitoring Agent for finley'.",
          },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    const aiData = await aiResponse.json()
    const cleanContent = aiData.choices[0].message.content.replace(/[\u00A0]/g, ' ')
    const parsed = JSON.parse(cleanContent)
    const simulatedEvents = parsed.events || []
    newEventsForState = []

    for (const event of simulatedEvents) {
      if (newEventsForState.length >= MAP_CREATE_EVENT_FLAG_COUNT) {
        break
      }
      console.log(`Processing AI Event for: ${event.node}`)

      const cmdbRes = await fetch(
        `${SN_INSTANCE}/api/now/table/cmdb_ci_ni_telco_equipment?sysparm_query=name=${
          event.node
        }&sysparm_fields=location.latitude,location.longitude,sys_id,name`,
        { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } },
      )
      const cmdbData = await cmdbRes.json()
      const asset = cmdbData.result?.[0]

      if (asset) {
        const lat = asset['location.latitude'] ? parseFloat(asset['location.latitude']) : null
        const lng = asset['location.longitude'] ? parseFloat(asset['location.longitude']) : null

        const localMatch = eventCandidates.find((c) => c.assetName === event.node)
        const finalLat = lat || localMatch?.latitude
        const finalLng = lng || localMatch?.longitude

        if (finalLat && finalLng) {
          const eventRes = await fetch(`${SN_INSTANCE}/api/now/table/em_event`, {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: 'ONTData',
              node: event.node,
              type: event.type,
              severity: event.severity.toString(),
              description: event.description,
              additional_info: event.additional_info,
              resource: event.node,
              time_of_event: new Date().toISOString().replace('T', ' ').split('.')[0],
            }),
          })
          const eventResult = await eventRes.json()

          const arcgisFid = await syncAddFlagToArcGIS(finalLng, finalLat)

          newEventsForState.push({
            assetRid: localMatch ? localMatch.assetRid : asset.sys_id,
            assetName: event.node,
            category: 'ONT',
            longitude: finalLng,
            latitude: finalLat,
            arcgisFid,
            eventId: eventResult.result?.sys_id,
          })
        }
      }
    }

    console.log('Updating map with new flags:', newEventsForState)
    if (newEventsForState.length > 0) {
      createEvents(newEventsForState)
    }
  } catch (error) {
    console.error('Health Agent Error:', error)
    newEventsForState = []
  } finally {
    setCreating(false)
    console.groupEnd()
  }

  const deficit = MAP_CREATE_EVENT_FLAG_COUNT - newEventsForState.length
  if (deficit > 0) {
    if (eventCandidates.length > 0) {
      if (newEventsForState.length === 0) {
        console.info(
          '[Map events] Health path added no events; adding random test flags to reach 5 on the map.',
        )
      } else {
        console.info(
          `[Map events] Topping up with ${deficit} random flag(s) to reach ${MAP_CREATE_EVENT_FLAG_COUNT} per click.`,
        )
      }
      await addRandomMapEventsToArcgis(
        eventCandidates,
        createEvents,
        setCreating,
        onArcgisMutationComplete,
        deficit,
      )
    } else {
      console.warn(
        '[Map events] Cannot top up: no point candidates in funding data; open events in app may be < 5.',
      )
      onArcgisMutationComplete?.()
    }
  } else {
    onArcgisMutationComplete?.()
  }
}

export async function addRandomMapEventsToArcgis(
  eventCandidates: MapEventLocationCandidate[],
  createEvents: (items: (MapEventLocationCandidate & { arcgisFid?: number })[]) => void,
  setCreating: (b: boolean) => void,
  onArcgisMutationComplete?: () => void,
  count: number = MAP_CREATE_EVENT_FLAG_COUNT,
) {
  if (count <= 0) {
    onArcgisMutationComplete?.()
    return
  }
  if (eventCandidates.length === 0) {
    console.warn(
      '[Map events] No point candidates in funding data; cannot add Event Warning features.',
    )
    onArcgisMutationComplete?.()
    return
  }
  setCreating(true)
  try {
    const selected = pickRandomCandidates(eventCandidates, count)
    const newEvents: (MapEventLocationCandidate & { arcgisFid?: number })[] = []
    for (const event of selected) {
      const fid = await syncAddFlagToArcGIS(event.longitude, event.latitude)
      newEvents.push({ ...event, arcgisFid: fid })
    }
    if (newEvents.length > 0) {
      createEvents(newEvents)
    }
  } catch (e) {
    console.error('[Map events] ArcGIS add flags failed:', e)
  } finally {
    setCreating(false)
    onArcgisMutationComplete?.()
  }
}

export async function resolveAllOpenEventsOnArcgis(
  openEvents: MapEventRecord[],
  resolveEvent: (eventId: string) => void,
  setResolving: (b: boolean) => void,
  onArcgisMutationComplete?: () => void,
) {
  if (openEvents.length === 0) return
  setResolving(true)
  try {
    for (const event of openEvents) {
      if (event.arcgisFid) {
        await syncDeleteFlagFromArcGIS(event.arcgisFid)
      }
      resolveEvent(event.id)
    }
  } finally {
    setResolving(false)
    onArcgisMutationComplete?.()
  }
}
