const USERNAME = import.meta.env.VITE_ARCGIS_USERNAME
const PASSWORD = import.meta.env.VITE_ARCGIS_PASSWORD
const PORTAL_URL = import.meta.env.VITE_ARCGIS_PORTAL_URL
const SERVICE_ROOT = import.meta.env.VITE_ARCGIS_SERVICE_ROOT

export type MapServiceLayerInfo = { id: number; name: string }

/** Normalize ArcGIS layer names for matching (handles Event_Warning, event-warning, etc.). */
function normalizeLayerName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fetches sublayer table from a Map/ImageFeature service root.
 * Used so UI does not rely on hardcoded layer indices (they change when services are republished).
 */
export async function fetchMapServiceLayers(
  serviceRoot: string,
  token: string,
): Promise<MapServiceLayerInfo[]> {
  const sep = serviceRoot.includes('?') ? '&' : '?'
  const url = `${serviceRoot}${sep}f=json&token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  const meta = await res.json()
  if (!Array.isArray(meta.layers)) return []
  return meta.layers.map((l: { id: number; name?: string }) => ({
    id: l.id,
    name: l.name ?? '',
  }))
}

/**
 * Removes duplicate sublayer ids and duplicate service names (same title, different id),
 * which otherwise create duplicate entries in the Legend.
 */
export function dedupeOrderedSublayerIds(
  orderedIds: number[],
  metaLayers: MapServiceLayerInfo[],
): number[] {
  const uniqueIds: number[] = []
  const seenId = new Set<number>()
  for (const id of orderedIds) {
    if (seenId.has(id)) continue
    seenId.add(id)
    uniqueIds.push(id)
  }
  if (metaLayers.length === 0) return uniqueIds

  const metaById = new Map(metaLayers.map((m) => [m.id, m]))
  const seenName = new Set<string>()
  const out: number[] = []
  for (const id of uniqueIds) {
    const meta = metaById.get(id)
    const nameKey = meta ? normalizeLayerName(meta.name) : `__id_${id}`
    if (seenName.has(nameKey)) continue
    seenName.add(nameKey)
    out.push(id)
  }
  return out
}

/**
 * MapServer draw order for `Map.layers`: first id = bottom, last id = top.
 * Event Warning is always moved to the top (above Service Location) so markers are not covered.
 * Matchers run in order; each layer id is used at most once.
 */
export function resolveOrderedLayerIds(layers: MapServiceLayerInfo[]): number[] {
  const n = (name: string) => normalizeLayerName(name)
  const used = new Set<number>()
  const ordered: number[] = []

  const tryAdd = (predicate: (norm: string, raw: string) => boolean) => {
    const found = layers.find((l) => !used.has(l.id) && predicate(n(l.name), l.name))
    if (found) {
      used.add(found.id)
      ordered.push(found.id)
    }
  }

  // Lines first (bottom), then structures, then points (top)
  tryAdd((s) => /\bdrop\b/.test(s) && /\bfiber\b/.test(s) && !/\bsplice\b/.test(s))
  tryAdd(
    (s) =>
      (/\bdistribution\b/.test(s) && /\bfiber\b/.test(s) && !/\bsplice\b/.test(s)) ||
      (/\bdist\b/.test(s) && /\bfiber\b/.test(s) && !/\bdrop\b/.test(s) && !/\bsplice\b/.test(s)),
  )
  tryAdd((s) => /\bhandhole\b/.test(s))
  tryAdd(
    (s) =>
      /\bsplice\b/.test(s) &&
      !/\bdrop\b/.test(s) &&
      (/\bdistribution\b/.test(s) || /\bdist\b/.test(s)),
  )
  tryAdd((s) => /\bdrop\b/.test(s) && /\bsplice\b/.test(s))
  // Require both tokens so names like "Optical …" do not match on a bare "pon" substring
  tryAdd((s) => /\bpon\b/.test(s) && /\bcabinet\b/.test(s) && !/\bsplice\b/.test(s))
  tryAdd((s) => /\bevent\b/.test(s) && /\bwarning\b/.test(s))
  tryAdd((s) => /\bservice\b/.test(s) && /\blocation\b/.test(s))

  const rest = [...layers].sort((a, b) => a.id - b.id).filter((l) => !used.has(l.id))
  for (const l of rest) {
    used.add(l.id)
    ordered.push(l.id)
  }

  // Map.layers draws last = on top. Put Service Location then Event Warning last so warnings (often id 1) stay visible.
  const isEventWarning = (l: MapServiceLayerInfo) => {
    const s = n(l.name)
    return /\bevent\b/.test(s) && /\bwarning\b/.test(s)
  }
  const isServiceLocation = (l: MapServiceLayerInfo) => {
    const s = n(l.name)
    return /\bservice\b/.test(s) && /\blocation\b/.test(s)
  }
  const serviceTail = [...layers]
    .filter(isServiceLocation)
    .sort((a, b) => a.id - b.id)
    .map((l) => l.id)
    .filter((id) => ordered.includes(id))
  const eventTail = [...layers]
    .filter(isEventWarning)
    .sort((a, b) => a.id - b.id)
    .map((l) => l.id)
    .filter((id) => ordered.includes(id))
  const pull = new Set([...serviceTail, ...eventTail])
  const core = ordered.filter((id) => !pull.has(id))
  return [...core, ...serviceTail, ...eventTail]
}
/**
 * AUTH: Gets a fresh token
 */
async function getToken() {
  if (!PORTAL_URL) {
    throw new Error('VITE_ARCGIS_PORTAL_URL is not set (needed for applyEdits token).')
  }
  const params = new URLSearchParams({
    username: USERNAME,
    password: PASSWORD,
    referer: window.location.origin,
    f: 'json',
    expiration: '60',
  })
  const res = await fetch(`${PORTAL_URL}/sharing/rest/generateToken`, { method: 'POST', body: params })
  const data = await res.json()
  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : (data.error.message ?? data.error)
    throw new Error(`generateToken: ${String(msg)}`)
  }
  if (!data.token) {
    throw new Error('generateToken: no token in response')
  }
  return data.token
}

/**
 * DYNAMIC LOOKUP: Event Warning sublayer (same match rules as resolveOrderedLayerIds / map legend).
 * Exact `l.name` checks fail for e.g. "Event_Warning" (lowercased ≠ "event warning").
 */
function isEventWarningLayerName(name: string): boolean {
  const s = normalizeLayerName(name)
  return /\bevent\b/.test(s) && /\bwarning\b/.test(s)
}

async function getEventWarningLayerUrl(token: string) {
  if (!SERVICE_ROOT) {
    throw new Error('VITE_ARCGIS_SERVICE_ROOT is not set')
  }
  const response = await fetch(`${SERVICE_ROOT}?f=json&token=${token}`)
  const metadata = await response.json()
  if (metadata.error) {
    throw new Error(`Map service: ${String(metadata.error.message || metadata.error)}`)
  }
  if (!Array.isArray(metadata.layers)) {
    throw new Error('Map service has no sublayers in metadata')
  }
  const layer = metadata.layers.find((l: { name?: string }) => isEventWarningLayerName(l.name || ''))
  if (!layer) {
    const names = metadata.layers.map((l: { name?: string }) => l.name).join(', ')
    throw new Error(
      `Event Warning sublayer not found. Available: ${names || '(none)'}; check layer name vs isEventWarningLayerName.`,
    )
  }
  return `${SERVICE_ROOT}/${layer.id}`
}

/**
 * CREATE: Adds a flag and returns the FID (OBJECTID)
 */
/**
 * CREATE: Adds a flag and returns the FID (OBJECTID)
 * @param lon - Expects negative value (~-104)
 * @param lat - Expects positive value (~32)
 */
export async function syncAddFlagToArcGIS(lon: number, lat: number) {
  const token = await getToken();
  const layerUrl = await getEventWarningLayerUrl(token);

  // Explicitly mapping variables to ensure ArcGIS gets X=Longitude and Y=Latitude
  const editParams = new URLSearchParams({
    adds: JSON.stringify([{
      attributes: { 
        Latitude: lat,  // Maps to the column in your ArcGIS table
        Longitude: lon 
      },
      geometry: { 
        x: lon, // ArcGIS X is always Longitude
        y: lat, // ArcGIS Y is always Latitude
        spatialReference: { wkid: 4326 } 
      }
    }]),
    f: 'json',
    token: token
  });

  const res = await fetch(`${layerUrl}/applyEdits`, { method: 'POST', body: editParams })
  const result = await res.json()

  if (result.error) {
    const e = result.error
    throw new Error(`applyEdits: ${e.message || JSON.stringify(e)}`)
  }

  const addResults = Array.isArray(result) ? result[0].addResults : result.addResults
  const first = addResults?.[0]
  
  if (first && first.success === false) {
    throw new Error(`applyEdits add failed: ${first.error?.description || 'Unknown error'}`)
  }

  const oid = first?.objectId
  if (oid == null) {
    throw new Error('applyEdits: no objectId returned')
  }
  
  return oid
}

/**
 * DELETE: Removes the flag from ArcGIS
 */
export async function syncDeleteFlagFromArcGIS(fid: number) {
  const token = await getToken();
  const layerUrl = await getEventWarningLayerUrl(token); // Dynamic URL

  const deleteParams = new URLSearchParams({
    objectIds: fid.toString(),
    f: 'json',
    token: token
  });

  await fetch(`${layerUrl}/deleteFeatures`, { method: 'POST', body: deleteParams });
}


/**
 * DELETE ALL: Finds all features in the Event Warning layer and clears them
 */
export async function syncClearAllFlagsFromArcGIS() {
  const token = await getToken();
  const layerUrl = await getEventWarningLayerUrl(token);

  // 1. Query for all ObjectIDs (FIDs) currently in the layer
  const queryParams = new URLSearchParams({
    where: "1=1", // Get everything
    returnIdsOnly: "true",
    f: "json",
    token: token
  });

  const queryRes = await fetch(`${layerUrl}/query?${queryParams}`);
  const queryData = await queryRes.json();
  const objectIds = queryData.objectIds;

  if (objectIds && objectIds.length > 0) {
    // 2. Delete all found IDs
    const deleteParams = new URLSearchParams({
      objectIds: objectIds.join(','),
      f: 'json',
      token: token
    });
    
    const delRes = await fetch(`${layerUrl}/deleteFeatures`, { method: 'POST', body: deleteParams });
    return await delRes.json();
  }
  
  return { success: true, message: "No flags to delete" };
}