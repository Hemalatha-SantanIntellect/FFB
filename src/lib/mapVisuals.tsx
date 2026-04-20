const CATEGORY_ORDER = [
  'AERIAL_LOOP_COIL',
  'ANCHOR',
  'CONDUIT',
  'EQUIPMENT',
  'FIBER_DIST',
  'FIBER_DROP',
  'HANDHOLE',
  'PEDESTAL',
  'POLE',
  'SPLICE_CASE',
] as const

export type AssetCategory = (typeof CATEGORY_ORDER)[number]

export const MAP_ASSET_PALETTE: Record<AssetCategory, string> = {
  AERIAL_LOOP_COIL: '#0d9488',
  ANCHOR: '#b45309',
  CONDUIT: '#2563eb',
  EQUIPMENT: '#4f46e5',
  FIBER_DIST: '#7c3aed',
  FIBER_DROP: '#db2777',
  HANDHOLE: '#0891b2',
  PEDESTAL: '#059669',
  POLE: '#6b7280',
  SPLICE_CASE: '#ea580c',
}

export const MAP_ASSET_RGB: Record<AssetCategory, [number, number, number]> = {
  AERIAL_LOOP_COIL: [13, 148, 136],
  ANCHOR: [180, 83, 9],
  CONDUIT: [37, 99, 235],
  EQUIPMENT: [79, 70, 229],
  FIBER_DIST: [124, 58, 237],
  FIBER_DROP: [219, 39, 119],
  HANDHOLE: [8, 145, 178],
  PEDESTAL: [5, 150, 105],
  POLE: [107, 114, 128],
  SPLICE_CASE: [234, 88, 12],
}

export const MAP_ASSET_CATEGORIES: readonly AssetCategory[] = CATEGORY_ORDER

export function mapLegendLabel(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase())
}

export function isLinearCategory(value: string) {
  return value === 'CONDUIT' || value === 'FIBER_DIST' || value === 'FIBER_DROP'
}

export function drawFundingIconImageData(type: string, color: string, size = 64): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const cx = size / 2
  const cy = size / 2
  ctx.clearRect(0, 0, size, size)
  ctx.strokeStyle = '#0f172a'
  ctx.fillStyle = color
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  switch (type) {
    case 'POLE':
      ctx.fillRect(cx - 4, 10, 8, 44)
      ctx.fillRect(cx - 16, 15, 32, 6)
      ctx.strokeRect(cx - 4, 10, 8, 44)
      break
    case 'PEDESTAL':
      ctx.fillRect(cx - 15, cy - 20, 30, 40)
      ctx.strokeRect(cx - 15, cy - 20, 30, 40)
      break
    case 'HANDHOLE':
      ctx.beginPath()
      ctx.ellipse(cx, cy, 22, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      break
    case 'SPLICE_CASE':
      ctx.beginPath()
      ctx.moveTo(cx, cy - 20)
      ctx.lineTo(cx + 20, cy)
      ctx.lineTo(cx, cy + 20)
      ctx.lineTo(cx - 20, cy)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'ANCHOR':
      ctx.beginPath()
      ctx.moveTo(cx, cy - 10)
      ctx.lineTo(cx + 15, cy + 15)
      ctx.lineTo(cx - 15, cy + 15)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy - 10)
      ctx.lineTo(cx, 5)
      ctx.stroke()
      break
    case 'AERIAL_LOOP_COIL':
      ctx.beginPath()
      ctx.arc(cx, cy, 18, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 10, 0, Math.PI * 2)
      ctx.stroke()
      break
    case 'EQUIPMENT':
      ctx.fillRect(cx - 18, cy - 18, 36, 36)
      ctx.strokeRect(cx - 18, cy - 18, 36, 36)
      ctx.beginPath()
      ctx.moveTo(cx - 18, cy - 18)
      ctx.lineTo(cx + 18, cy + 18)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 18, cy - 18)
      ctx.lineTo(cx - 18, cy + 18)
      ctx.stroke()
      break
    default:
      ctx.beginPath()
      ctx.arc(cx, cy, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
  }

  return ctx.getImageData(0, 0, size, size)
}

export function drawFundingIconDataUrl(type: string, color: string, size = 64): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imageData = drawFundingIconImageData(type, color, size)
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

type LegendGlyphProps = {
  category: string
  color: string
  mode?: '2d' | '3d'
  className?: string
}

/**
 * 2D symbol glyph used by the map legend.
 */
export function AssetLegendIcon({ category, color, mode = '2d', className }: LegendGlyphProps) {
  if (mode === '3d') {
    if (isLinearCategory(category)) {
      return (
        <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden>
          <path
            d="M4 24c5.2-4 10-5.8 14.5-5.4 4.6.4 8.6 2.3 13.5 5.4"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={category === 'FIBER_DROP' ? '4 4' : category === 'FIBER_DIST' ? '7 3' : '0'}
          />
          <path
            d="M4 26c5.2-4 10-5.8 14.5-5.4 4.6.4 8.6 2.3 13.5 5.4"
            stroke="#0f172a"
            strokeOpacity="0.18"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )
    }

    return (
      <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden>
        <ellipse cx="18" cy="9" rx="6.5" ry="3.2" fill="#f8fafc" fillOpacity="0.95" />
        <ellipse cx="18" cy="9" rx="6.5" ry="3.2" fill={color} fillOpacity="0.42" />
        <path d="M11.5 9v11.8c0 2.1 2.9 3.8 6.5 3.8s6.5-1.7 6.5-3.8V9" fill={color} fillOpacity="0.72" />
        <ellipse cx="18" cy="20.8" rx="6.5" ry="3.2" fill={color} fillOpacity="0.58" />
      </svg>
    )
  }

  if (isLinearCategory(category)) {
    return (
      <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden>
        <circle cx="18" cy="18" r="14" fill={`${color}12`} />
        <path
          d="M5 25c5.5-4.2 10.2-6 14.7-5.7C24.4 19.7 28.8 22 31 25"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={category === 'FIBER_DROP' ? '4 4' : category === 'FIBER_DIST' ? '7 3' : '0'}
        />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden
    >
      <circle cx="18" cy="18" r="14" fill={`${color}18`} />
      {category === 'POLE' && (
        <>
          <rect x="16" y="8" width="4" height="20" rx="1" fill={color} />
          <rect x="11" y="11" width="14" height="3" rx="1" fill={color} />
        </>
      )}
      {category === 'PEDESTAL' && <rect x="11" y="9" width="14" height="18" rx="2" fill={color} />}
      {category === 'HANDHOLE' && <ellipse cx="18" cy="18" rx="9" ry="6" fill={color} />}
      {category === 'SPLICE_CASE' && (
        <>
          <path d="M18 8 27 18 18 28 9 18 18 8Z" fill={color} />
          <circle cx="18" cy="18" r="2.2" fill="#fff" />
        </>
      )}
      {category === 'ANCHOR' && (
        <>
          <path d="M18 9 25 21H11l7-12Z" fill={color} />
          <path d="M18 9v-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {category === 'AERIAL_LOOP_COIL' && (
        <>
          <circle cx="18" cy="18" r="8.8" stroke={color} strokeWidth="3" />
          <circle cx="18" cy="18" r="4.4" stroke={color} strokeWidth="2.5" />
        </>
      )}
      {category === 'EQUIPMENT' && (
        <>
          <rect x="10.5" y="10.5" width="15" height="15" rx="1.8" fill={color} />
          <path d="M11.8 11.8l12.4 12.4M24.2 11.8 11.8 24.2" stroke="#fff" strokeOpacity="0.9" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}
