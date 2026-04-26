const USERNAME = import.meta.env.VITE_ARCGIS_USERNAME
const PASSWORD =  import.meta.env. VITE_ARCGIS_PASSWORD
const PORTAL_URL =  import.meta.env.VITE_ARCGIS_PORTAL_URL
const SERVICE_ROOT =  import.meta.env.VITE_ARCGIS_SERVICE_ROOT
/**
 * AUTH: Gets a fresh token
 */
async function getToken() {
  const params = new URLSearchParams({
    username: USERNAME,
    password: PASSWORD,
    referer: window.location.origin,
    f: 'json',
    expiration: '60'
  });
  const res = await fetch(`${PORTAL_URL}/sharing/rest/generateToken`, { method: 'POST', body: params });
  const data = await res.json();
  return data.token;
}

/**
 * DYNAMIC LOOKUP: Finds the layer ID (e.g., 6) by searching for "Event Warning"
 */
async function getEventWarningLayerUrl(token: string) {
  const response = await fetch(`${SERVICE_ROOT}?f=json&token=${token}`);
  const metadata = await response.json();
  
  // Scans for the "Event Warning" layer dynamically
  const layer = metadata.layers.find((l: any) => l.name.toLowerCase() === "event_warning" || l.name.toLowerCase() === "event warning");
  
  if (!layer) throw new Error(`Layer "Event Warning" not found.`);
  
  return `${SERVICE_ROOT}/${layer.id}`;
}

/**
 * CREATE: Adds a flag and returns the FID (OBJECTID)
 */
export async function syncAddFlagToArcGIS(lon: number, lat: number) {
  const token = await getToken();
  const layerUrl = await getEventWarningLayerUrl(token); // Dynamic URL instead of hardcoded /6/

  const editParams = new URLSearchParams({
    adds: JSON.stringify([{
      attributes: { Latitude: lat, Longitude: lon },
      geometry: { x: lon, y: lat, spatialReference: { wkid: 4326 } }
    }]),
    f: 'json',
    token: token
  });

  const res = await fetch(`${layerUrl}/applyEdits`, { method: 'POST', body: editParams });
  const result = await res.json();
  
  // Note: result for applyEdits usually returns an array [ { addResults: [...] } ]
  // We handle both potential response formats here
  const addResults = Array.isArray(result) ? result[0].addResults : result.addResults;
  return addResults?.[0]?.objectId; 
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