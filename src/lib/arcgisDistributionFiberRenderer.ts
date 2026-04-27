import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'

/** Matches hosted layer names like "DigitalTwin Demo Design WFL1 - Distribution Fiber". */
export function isDistributionFiberLayerName(name: string): boolean {
  const n = name.toLowerCase().replace(/[_-]+/g, ' ')
  return n.includes('distribution') && n.includes('fiber') && !n.includes('splice')
}

function pickField(
  fieldNames: string[],
  exact: string[],
): string | null {
  const lower = fieldNames.map((n) => n.toLowerCase())
  for (const e of exact) {
    const i = lower.indexOf(e.toLowerCase())
    if (i >= 0) return fieldNames[i]
  }
  return null
}

function resolveSizeField(fieldNames: string[]): string | null {
  return (
    pickField(fieldNames, ['size', 'SIZE', 'cable_size', 'Cable_Size', 'fiber_size']) ??
    fieldNames.find((n) => {
      const l = n.toLowerCase()
      return l.includes('size') && !l.includes('resize')
    }) ??
    null
  )
}

function resolvePlacementField(fieldNames: string[]): string | null {
  return (
    pickField(fieldNames, ['placement', 'Placement', 'PLACEMENT', 'place_type', 'Place_Type']) ??
    fieldNames.find((n) => n.toLowerCase().includes('placement')) ??
    null
  )
}

/** Legend: 12 yellow, 24 red, 48 green, 96 blue, 144 pink, 288 cyan. */
const SIZE_COLORS: Record<number, string> = {
  12: '#facc15',
  24: '#ef4444',
  48: '#4ade80',
  96: '#1e40af',
  144: '#ec4899',
  288: '#22d3ee',
}

const SIZES = [12, 24, 48, 96, 144, 288] as const
const PLACEMENTS = ['AER', 'UG'] as const

function lineSymbol(color: string, aerial: boolean) {
  return {
    type: 'simple-line' as const,
    color,
    width: 2.75,
    style: (aerial ? 'short-dash' : 'solid') as 'short-dash' | 'solid',
    cap: 'round' as const,
    join: 'round' as const,
  }
}

function buildValueExpression(sizeField: string, placementField: string): string {
  const sf = sizeField.replace(/'/g, "''")
  const pf = placementField.replace(/'/g, "''")
  return `
    function normPl(p) {
      var t = Upper(Trim(Text(DefaultValue(p, ''), '')));
      if (t == '') return '';
      if (Find('AER', t) >= 0 || Find('AERIAL', t) >= 0 || t == 'A') return 'AER';
      if (Find('UG', t) >= 0 || Find('UNDER', t) >= 0 || Find('BUR', t) >= 0) return 'UG';
      return t;
    }
    var sz0 = DefaultValue($feature['${sf}'], null);
    if (sz0 == null || sz0 == '') return '';
    var szNum = Number(sz0);
    if (IsNan(szNum)) return '';
    var sz = Text(Round(szNum, 0), '#');
    var pl = normPl($feature['${pf}']);
    if (pl == '') return '';
    return sz + ',' + pl;
  `
}

/**
 * Applies Size × Placement symbology for Distribution Fiber (ArcGIS DigitalTwin legend).
 * No-op if fields are missing or geometry is not polyline.
 */
export async function applyDistributionFiberRenderer(layer: FeatureLayer): Promise<boolean> {
  await layer.load()
  if (layer.geometryType !== 'polyline') return false

  const title = (layer.title ?? layer.portalItem?.title ?? '').trim()
  const layerName = (layer as unknown as { sourceJSON?: { name?: string } }).sourceJSON?.name ?? title
  if (!isDistributionFiberLayerName(layerName) && !isDistributionFiberLayerName(title)) {
    return false
  }

  const fieldNames = (layer.fields ?? []).map((f) => f.name)
  const sizeField = resolveSizeField(fieldNames)
  const placementField = resolvePlacementField(fieldNames)
  if (!sizeField || !placementField) {
    if (import.meta.env.DEV) {
      console.warn(
        '[ArcGIS] Distribution Fiber layer found but Size/Placement fields not resolved.',
        { fieldNames, title, layerName },
      )
    }
    return false
  }

  const uniqueValueInfos = SIZES.flatMap((sz) =>
    PLACEMENTS.map((pl) => ({
      value: `${sz},${pl}`,
      label: `${sz},${pl}`,
      symbol: lineSymbol(SIZE_COLORS[sz] ?? '#64748b', pl === 'AER'),
    })),
  )

  layer.renderer = new UniqueValueRenderer({
    valueExpression: buildValueExpression(sizeField, placementField),
    valueExpressionTitle: 'Size, Placement',
    uniqueValueInfos,
    defaultSymbol: lineSymbol('#94a3b8', false),
    defaultLabel: 'Other',
    legendOptions: {
      title: 'Distribution Fiber',
    },
  })

  if (import.meta.env.DEV) {
    console.info('[ArcGIS] Applied Size×Placement renderer', { sizeField, placementField, layerName })
  }
  return true
}
