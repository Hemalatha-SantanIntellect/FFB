import { 
  Activity, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Wind, 
  Zap, 
  Gauge, 
  MapPin,
  Construction,
  X,
  Send,
  CheckCircle2,
  ChevronLeft,
  Layers,
  ArrowRight
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// Data Imports
import fundingData from '@/data/fin_funding.json'
import sensorData from '@/data/fin_sensor.json'

const ASSET_COLORS: Record<string, string> = {
  AERIAL_LOOP_COIL: '#ef4444', 
  ANCHOR: '#f59e0b',           
  CONDUIT: '#10b981',          
  EQUIPMENT: '#3b82f6',        
  FIBER_DIST: '#8b5cf6',       
  FIBER_DROP: '#ec4899',       
  HANDHOLE: '#6366f1',         
  PEDESTAL: '#14b8a6',         
  POLE: '#71717a',             
  SPLICE_CASE: '#f97316',      
}

const CRITICALITY_THEMES = {
  Critical: 'border-l-rose-500 bg-rose-50/50 text-rose-700 icon-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
  High: 'border-l-orange-500 bg-orange-50/50 text-orange-700 icon-orange-600',
  Medium: 'border-l-amber-500 bg-amber-50/50 text-amber-700 icon-amber-600',
  Low: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-700 icon-emerald-600',
}

const SENSOR_ICONS: Record<string, any> = {
  '3-Axis Accelerometer': Activity,
  'Moisture/Intrusion Sensor': Droplets,
  'Hydrostatic Pressure Sensor': Gauge,
  'Optical Time Domain Reflectometer': Zap,
  'Distributed Acoustic Sensing': Wind,
  'Multi-Gas & Water Level': AlertTriangle,
  'Strain Gauge': Construction,
  'Smart Power Meter': Zap,
  'Distributed Temperature & Strain': Thermometer,
}

export function SensorHealthStrip() {
  const [viewMode, setViewMode] = useState<'groups' | 'drilldown'>('groups')
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [reportingSensor, setReportingSensor] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // FIX: Computed groups and stats in ONE top-level hook to avoid loop errors
  const layerGroups = useMemo(() => {
    const groups: Record<string, any> = {}
    
    sensorData.forEach(sensor => {
      const layer = sensor.associated_layer
      if (!groups[layer]) {
        groups[layer] = {
          name: layer,
          count: 0,
          color: ASSET_COLORS[layer] || '#64748b',
          dist: { Critical: 0, High: 0, Medium: 0, Low: 0 },
          defects: new Set<string>()
        }
      }
      
      groups[layer].count++
      groups[layer].dist[sensor.criticality as keyof typeof groups[typeof layer]['dist']]++
      groups[layer].defects.add(sensor.defect_type)
    })

    return Object.values(groups).map(g => ({
      ...g,
      defects: Array.from(g.defects).slice(0, 2) // Keep top 2 defects for UI cleanliness
    }))
  }, [])

  const enrichedSensors = useMemo(() => {
    const data = sensorData.map((sensor) => {
      let assetInfo = { guid: 'N/A', lat: 0, lng: 0, rid: 'N/A' }
      const layerAssets = (fundingData as any)[sensor.associated_layer] || []
      const match = layerAssets.find((a: any) => a.sensor_metadata?.sensor_uid === sensor.sensor_uid)

      if (match) {
        assetInfo = {
          guid: match.guid,
          lat: match.geometry.y || (match.geometry.paths ? match.geometry.paths[0][0][1] : 0),
          lng: match.geometry.x || (match.geometry.paths ? match.geometry.paths[0][0][0] : 0),
          rid: match.rid
        }
      }
      return { ...sensor, ...assetInfo }
    })

    if (viewMode === 'drilldown' && selectedLayer && selectedLayer !== 'All Layers') {
      return data.filter(s => s.associated_layer === selectedLayer)
    }
    return data
  }, [viewMode, selectedLayer])

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setReportingSensor(null)
      }, 2200)
    }, 1200)
  }

  const closeModal = useCallback(() => {
    setReportingSensor(null)
    setShowSuccess(false)
    setIsSubmitting(false)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {viewMode === 'drilldown' && (
            <button 
              onClick={() => setViewMode('groups')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-600" />
            </button>
          )}
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-500" />
            {viewMode === 'groups' ? 'Sensor Infrastructure Groups' : `Sensor Component: ${selectedLayer}`}
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {viewMode === 'groups' && (
            <button
              onClick={() => {
                setSelectedLayer('All Layers');
                setViewMode('drilldown');
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-sky-600 hover:text-sky-800 bg-sky-50 px-3 py-1.5 rounded-md border border-sky-100 transition-all cursor-pointer"
            >
              Show All
            </button>
          )}
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {viewMode === 'groups' ? `${layerGroups.length} Layers` : `${enrichedSensors.length} Triggered Sensors`}
          </span>
        </div>
      </div>

      {/* VIEW 1: Grouped Summary Cards */}
      {viewMode === 'groups' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5">
          {layerGroups.map((group) => (
            <button
              key={group.name}
              onClick={() => {
                setSelectedLayer(group.name)
                setViewMode('drilldown')
              }}
              className="group relative flex flex-col items-start rounded-xl border border-neutral-200 bg-white p-5 text-left transition-all hover:border-neutral-300 hover:shadow-xl active:scale-[0.98] cursor-pointer"
              style={{ borderTop: `4px solid ${group.color}` }}
            >
              <div className="flex w-full items-start justify-between">
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg transition-all group-hover:scale-110"
                  style={{ backgroundColor: `${group.color}15`, color: group.color }}
                >
                  <Layers className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Sensors</span>
                  <p className="text-xl font-black leading-none" style={{ color: group.color }}>{group.count}</p>
                </div>
              </div>

              <div className="mt-4 w-full min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 leading-none mb-1">Infrastructure Layer</p>
                <p className="truncate text-lg font-bold text-neutral-900 tracking-tight">{group.name.replace(/_/g, ' ')}</p>
              </div>

              {/* Health Distribution UI */}
              <div className="mt-5 w-full space-y-1.5">
                <div className="flex justify-between items-end">
                  <p className="text-[9px] font-bold uppercase tracking-tighter text-neutral-500">Condition</p>
                  <p className="text-[9px] font-mono text-neutral-400">Live</p>
                </div>
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="bg-rose-500 h-full" style={{ width: `${(group.dist.Critical / group.count) * 100}%` }} />
                  <div className="bg-orange-400 h-full" style={{ width: `${(group.dist.High / group.count) * 100}%` }} />
                  <div className="bg-amber-400 h-full" style={{ width: `${(group.dist.Medium / group.count) * 100}%` }} />
                  <div className="bg-emerald-400 h-full" style={{ width: `${(group.dist.Low / group.count) * 100}%` }} />
                </div>
              </div>

              <div className="mt-5 w-full pt-4 border-t border-dashed border-neutral-100">
                <div className="flex flex-wrap gap-1.5">
                  {group.defects.map((defect: string) => (
                    <span key={defect} className="rounded bg-neutral-50 px-1.5 py-0.5 text-[8px] font-bold text-neutral-600 border border-neutral-200 uppercase">
                      {defect}
                    </span>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <ArrowRight className="h-3 w-3 text-neutral-300" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* VIEW 2: Drilldown Grid */}
      {viewMode === 'drilldown' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-2">
          {enrichedSensors.map((s) => {
            const Icon = SENSOR_ICONS[s.sensor_type] || Activity
            const theme = CRITICALITY_THEMES[s.criticality as keyof typeof CRITICALITY_THEMES]
            
            return (
              <Card key={s.sensor_uid} className={cn("group relative border-l-[4px] p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden", theme)}>
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-current opacity-[0.03] transition-all group-hover:scale-150" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-2 rounded-lg bg-white shadow-sm", s.criticality === 'Critical' && "animate-pulse")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase opacity-70">{s.sensor_uid}</p>
                        <p className="text-sm font-bold text-neutral-900 leading-none mt-0.5">{s.sensor_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={cn("text-[9px] font-bold", s.criticality === 'Critical' ? "bg-rose-600 text-white" : "bg-neutral-800 text-white")}>
                        {s.criticality}
                      </Badge>
                      <button onClick={() => setReportingSensor(s)} className="text-[9px] font-bold text-neutral-500 underline decoration-dotted hover:text-neutral-900 transition-colors cursor-pointer">
                        Report Incident
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-white/60 p-2 border border-black/5">
                      <p className="text-[9px] font-bold uppercase text-neutral-500">Current</p>
                      <p className="text-lg font-black text-neutral-900 leading-none">{s.current_value} <span className="text-[10px] font-medium">{s.unit}</span></p>
                    </div>
                    <div className="rounded-md bg-white/60 p-2 border border-black/5">
                      <p className="text-[9px] font-bold uppercase text-neutral-500">Limit</p>
                      <p className="text-lg font-black text-neutral-900 leading-none opacity-40">{s.threshold} <span className="text-[10px] font-medium">{s.unit}</span></p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/5 mt-auto">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-rose-600 flex items-center gap-1"><MapPin className="h-3 w-3" /> DANGER ZONE</span>
                      <span className="font-mono text-neutral-500 uppercase">{s.associated_layer}</span>
                    </div>
                    <p className="text-[10px] font-mono font-normal text-neutral-800 mt-1 truncate">
                      RID: {s.rid}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-neutral-800 mt-1 truncate">
                      LOC: {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Incident Modal */}
      {reportingSensor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            {!showSuccess ? (
              <>
                <div className="flex items-center justify-between bg-neutral-900 px-6 py-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-rose-500 p-1.5 animate-pulse"><AlertTriangle className="h-4 w-4 text-white" /></div>
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-widest leading-none">Raise Incident</h2>
                      <p className="mt-1 text-[10px] text-neutral-400 font-mono uppercase">UID: {reportingSensor.sensor_uid}</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="rounded-full p-1 transition-colors hover:bg-white/10"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleReportSubmit} className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Assigned To</label>
                        <div className="rounded border bg-neutral-50 px-3 py-2 text-xs font-bold text-sky-600 tracking-tight">Finley Admin</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Priority</label>
                        <div className={cn("rounded border px-3 py-2 text-xs font-bold text-center capitalize", reportingSensor.criticality === 'Critical' ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-amber-50 text-amber-700 border-amber-100")}>{reportingSensor.criticality}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Asset GUID</label>
                      <div className="rounded border bg-neutral-50 px-3 py-2 text-[10px] font-mono text-neutral-700 truncate">{reportingSensor.guid}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Issue Summary</label>
                      <textarea required className="w-full rounded border border-neutral-200 p-3 text-xs leading-relaxed outline-none focus:border-sky-500" rows={4} defaultValue={`System Detection: ${reportingSensor.defect_type}. \nAsset: ${reportingSensor.sensor_name} shows anomalous value of ${reportingSensor.current_value} ${reportingSensor.unit}.`} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-sky-700 disabled:opacity-50">
                      {isSubmitting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Send className="h-4 w-4" />SUBMIT INCIDENT</>}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in zoom-in-90 duration-300">
                <div className="mb-4 rounded-full bg-emerald-100 p-4 text-emerald-600 ring-8 ring-emerald-50"><CheckCircle2 className="h-12 w-12" /></div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Incident Reported</h2>
                <p className="mt-2 text-sm text-neutral-500 px-4 leading-relaxed text-center">Ticket for <span className="font-bold text-neutral-700">{reportingSensor.sensor_uid}</span> dispatched to <span className="font-semibold text-sky-600">Finley Admin</span>.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}