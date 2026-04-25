import fundingData from '@/data/fin_funding.json'

const BASE_COLORS: Record<string, string> = {
  'Service location': '#8b5a2b',
  'Event Warning': '#ef4444',
  'PON Cabinet': '#39ff14',
  'Drop Splice': '#2563eb',
  'Distribution Splice': '#ef4444',
  Handhole: '#39ff14',
  'Distribution Fiber': '#22c55e',
  'Drop Fiber': '#7e22ce',
  'Optical Line Terminal': '#0ea5e9',
}

const FALLBACK_COLORS = ['#0ea5e9', '#14b8a6', '#6366f1', '#f97316', '#a855f7', '#e11d48']

export const MAP_ASSET_CATEGORIES: readonly string[] = Object.keys(
  fundingData as Record<string, unknown[]>,
).filter((key) => ((fundingData as Record<string, unknown[]>)[key] ?? []).length > 0)

export const MAP_ASSET_PALETTE: Record<string, string> = MAP_ASSET_CATEGORIES.reduce(
  (acc, category, index) => {
    acc[category] = BASE_COLORS[category] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
    return acc
  },
  {} as Record<string, string>,
)

export const MAP_ASSET_RGB: Record<string, [number, number, number]> = Object.fromEntries(
  Object.entries(MAP_ASSET_PALETTE).map(([category, color]) => {
    const hex = color.replace('#', '')
    const normalized = hex.length === 3 ? hex.split('').map((c) => `${c}${c}`).join('') : hex
    const r = Number.parseInt(normalized.slice(0, 2), 16)
    const g = Number.parseInt(normalized.slice(2, 4), 16)
    const b = Number.parseInt(normalized.slice(4, 6), 16)
    return [category, [r, g, b] as [number, number, number]]
  }),
)

export function mapLegendLabel(value: string) {
  return value
}

export function isLinearCategory(value: string) {
  return value === 'Distribution Fiber' || value === 'Drop Fiber'
}

const DISTRIBUTION_FIBER_COLORS: Record<string, string> = {
  '12': '#e5e91f',
  '24': '#ef4444',
  '48': '#39ff14',
  '96': '#2563eb',
  '144': '#f472d0',
  '288': '#67d8ef',
}

export function lineVisualForFeature(category: string, feature: Record<string, unknown>) {
  const connectivity = (feature.connectivity_logic ?? {}) as Record<string, unknown>
  if (category === 'Distribution Fiber') {
    const size = String(feature.size ?? connectivity.size ?? '').trim()
    const placement = String(feature.placement ?? connectivity.placement ?? '').trim().toUpperCase()
    return {
      color: DISTRIBUTION_FIBER_COLORS[size] ?? MAP_ASSET_PALETTE[category] ?? '#22c55e',
      dash: placement === 'AER' ? [2, 2] : undefined,
    }
  }
  if (category === 'Drop Fiber') {
    const placement = String(feature.placement ?? connectivity.placement ?? '').trim().toUpperCase()
    if (placement && placement !== 'UG' && placement !== 'AER') {
      return { color: '#94a3b8', dash: undefined }
    }
    return {
      color: '#7e22ce',
      dash: placement === 'AER' ? [2, 2] : undefined,
    }
  }
  return {
    color: MAP_ASSET_PALETTE[category] ?? '#64748b',
    dash: undefined,
  }
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
    case 'Service location':
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.arc(cx, cy, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = color
      ctx.fillRect(cx - 9, cy - 4, 18, 10)
      ctx.beginPath()
      ctx.moveTo(cx - 11, cy - 4)
      ctx.lineTo(cx, cy - 12)
      ctx.lineTo(cx + 11, cy - 4)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillRect(cx - 2.4, cy, 4.8, 6)
      break
    case 'Event Warning':
      ctx.fillStyle = '#fda4af'
      ctx.beginPath()
      ctx.arc(cx, cy, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(cx - 6, cy - 9, 2.5, 16)
      ctx.beginPath()
      ctx.moveTo(cx - 3.5, cy - 8)
      ctx.lineTo(cx + 9, cy - 4)
      ctx.lineTo(cx - 3.5, cy)
      ctx.closePath()
      ctx.fill()
      break
    case 'PON Cabinet':
      ctx.beginPath()
      for (let i = 0; i < 6; i += 1) {
        const angle = ((60 * i - 30) * Math.PI) / 180
        const px = cx + 13 * Math.cos(angle)
        const py = cy + 13 * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(cx, cy - 7)
      ctx.lineTo(cx + 7, cy + 6)
      ctx.lineTo(cx - 7, cy + 6)
      ctx.closePath()
      ctx.fill()
      break
    case 'Drop Splice':
    case 'Distribution Splice':
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(cx, cy, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = color
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx - 10, cy - 6)
      ctx.lineTo(cx - 2, cy)
      ctx.lineTo(cx - 10, cy + 6)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 10, cy - 6)
      ctx.lineTo(cx + 2, cy)
      ctx.lineTo(cx + 10, cy + 6)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
    case 'Handhole':
      ctx.fillRect(cx - 5, cy - 5, 10, 10)
      ctx.strokeRect(cx - 5, cy - 5, 10, 10)
      break
    case 'Optical Line Terminal':
      ctx.fillRect(cx - 13, cy - 7, 26, 14)
      ctx.strokeRect(cx - 13, cy - 7, 26, 14)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(cx - 7, cy - 1, 14, 2)
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
            strokeDasharray={category === 'Drop Fiber' ? '4 4' : category === 'Distribution Fiber' ? '7 3' : '0'}
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
          strokeDasharray={category === 'Drop Fiber' ? '4 4' : category === 'Distribution Fiber' ? '7 3' : '0'}
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
      {category === 'Service location' && (
        <>
          <circle cx="18" cy="18" r="12" fill="#f8fafc" stroke="#cbd5e1" />
          <path d="M10 17h16v8H10z" fill={color} />
          <path d="m9 17 9-6 9 6H9Z" fill={color} />
          <rect x="16.2" y="19" width="3.6" height="5.8" fill="#fff" />
        </>
      )}
      {category === 'Event Warning' && (
        <>
          <circle cx="18" cy="18" r="12" fill="#fda4af" stroke="#f43f5e" />
          <rect x="13.4" y="10.3" width="1.9" height="13.4" fill="#dc2626" />
          <path d="M15.4 10.8 24.2 13.8 15.4 16.5Z" fill="#dc2626" />
        </>
      )}
      {category === 'PON Cabinet' && (
        <>
          <path d="M18 6.8 27 12v10L18 27.2 9 22V12l9-5.2Z" fill={color} />
          <path d="M18 12.2 22.6 20h-9.2L18 12.2Z" fill="#fff" />
        </>
      )}
      {(category === 'Drop Splice' || category === 'Distribution Splice') && (
        <>
          <circle cx="18" cy="18" r="12" fill="#ffffff" stroke="#cbd5e1" />
          <path d="M8.5 12.5 15 18l-6.5 5.5v-11Z" fill={color} />
          <path d="M27.5 12.5 21 18l6.5 5.5v-11Z" fill={color} />
        </>
      )}
      {category === 'Handhole' && <rect x="13" y="13" width="10" height="10" rx="1.2" fill={color} />}
      {category === 'Optical Line Terminal' && <rect x="9" y="13" width="18" height="10" rx="1.5" fill={color} />}
    </svg>
  )
}
