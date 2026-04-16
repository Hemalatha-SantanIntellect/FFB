import type { Map as MapLibreMap } from 'maplibre-gl'

import { ASSET_TYPE_COLORS, getAssetMapImageId } from '@/lib/mapAssetGeoJSON'

type ShapeId = 'pole' | 'pedestal' | 'cabinet' | 'handhole' | 'transformer'

const SIZE = 64

function shapeForAssetType(assetType: string): ShapeId {
  switch (assetType) {
    case 'Pole':
      return 'pole'
    case 'Pedestal':
      return 'pedestal'
    case 'Cabinet':
      return 'cabinet'
    case 'Handhole':
      return 'handhole'
    case 'Ground Transformer':
      return 'transformer'
    default:
      return 'pole'
  }
}

function drawIcon(
  id: ShapeId,
  fill: string,
  stroke: string,
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  const cx = SIZE / 2
  const cy = SIZE / 2
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.strokeStyle = stroke
  ctx.fillStyle = fill
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  switch (id) {
    case 'pole': {
      ctx.fillRect(cx - 3, 10, 6, 44)
      ctx.fillRect(cx - 14, 12, 28, 5)
      ctx.strokeRect(cx - 3, 10, 6, 44)
      break
    }
    case 'pedestal': {
      ctx.fillRect(cx - 18, cy - 10, 36, 22)
      ctx.strokeRect(cx - 18, cy - 10, 36, 22)
      ctx.strokeStyle = stroke
      ctx.beginPath()
      ctx.moveTo(cx - 10, cy)
      ctx.lineTo(cx + 10, cy)
      ctx.stroke()
      break
    }
    case 'cabinet': {
      ctx.fillRect(cx - 16, cy - 18, 32, 36)
      ctx.strokeRect(cx - 16, cy - 18, 32, 36)
      ctx.strokeStyle = stroke
      ctx.beginPath()
      ctx.moveTo(cx - 8, cy - 6)
      ctx.lineTo(cx - 8, cy + 10)
      ctx.moveTo(cx + 8, cy - 6)
      ctx.lineTo(cx + 8, cy + 10)
      ctx.stroke()
      break
    }
    case 'handhole': {
      ctx.beginPath()
      ctx.arc(cx, cy, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = stroke
      ctx.beginPath()
      ctx.arc(cx, cy, 7, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'transformer': {
      ctx.fillRect(cx - 20, cy - 12, 40, 26)
      ctx.strokeRect(cx - 20, cy - 12, 40, 26)
      ctx.strokeStyle = stroke
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(cx - 14, cy - 4)
      ctx.lineTo(cx + 14, cy + 4)
      ctx.moveTo(cx + 14, cy - 4)
      ctx.lineTo(cx - 14, cy + 4)
      ctx.stroke()
      ctx.setLineDash([])
      break
    }
    default:
      break
  }

  return ctx.getImageData(0, 0, SIZE, SIZE)
}

const UNKNOWN_FILL = '#525252'

export function registerAssetTypeIcons(map: MapLibreMap): void {
  for (const key of Object.keys(ASSET_TYPE_COLORS)) {
    const mapId = getAssetMapImageId(key)
    const fill = ASSET_TYPE_COLORS[key]
    const stroke = '#0f172a'
    const shape = shapeForAssetType(key)
    const imageData = drawIcon(shape, fill, stroke)
    if (map.hasImage(mapId)) map.removeImage(mapId)
    map.addImage(mapId, imageData, { pixelRatio: 2 })
  }
  const unknownId = 'gis-type-unknown'
  if (map.hasImage(unknownId)) map.removeImage(unknownId)
  map.addImage(unknownId, drawIcon('pole', UNKNOWN_FILL, '#0f172a'), { pixelRatio: 2 })
}
