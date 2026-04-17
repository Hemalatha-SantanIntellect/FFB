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
  CheckCircle2
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// Data Imports
import fundingData from '@/data/fin_funding.json'
import sensorData from '@/data/fin_sensor.json'

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
  const [reportingSensor, setReportingSensor] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const enrichedSensors = useMemo(() => {
    return sensorData.map((sensor) => {
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
  }, [])

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API delay
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSuccess(true)
      
      // Auto-close modal after 2 seconds
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
          <Activity className="h-4 w-4 text-rose-500" />
          Live Sensor Health Monitoring
        </h3>
        <span className="text-[10px] font-medium text-neutral-400">Showing {enrichedSensors.length} active nodes</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {enrichedSensors.map((s) => {
          const Icon = SENSOR_ICONS[s.sensor_type] || Activity
          const theme = CRITICALITY_THEMES[s.criticality as keyof typeof CRITICALITY_THEMES]
          
          return (
            <Card 
              key={s.sensor_uid}
              className={cn(
                "group relative border-l-[4px] p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-default overflow-hidden",
                theme
              )}
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-current opacity-[0.03] transition-all group-hover:scale-150" />

              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg bg-white shadow-sm", s.criticality === 'Critical' && "animate-pulse")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.sensor_uid}</p>
                      <p className="text-sm font-bold tracking-tight text-neutral-900 leading-none mt-0.5">{s.sensor_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge className={cn("text-[9px] font-bold", s.criticality === 'Critical' ? "bg-rose-600 text-white" : "bg-neutral-800 text-white")}>
                      {s.criticality}
                    </Badge>
                    <button 
                      onClick={() => setReportingSensor(s)}
                      className="text-[9px] font-bold text-neutral-500 underline decoration-dotted hover:text-neutral-900 transition-colors"
                    >
                      Report Incident
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-white/60 p-2 border border-black/5">
                    <p className="text-[9px] font-bold uppercase text-neutral-500">Current Value</p>
                    <p className="text-lg font-black text-neutral-900 leading-none">
                      {s.current_value} <span className="text-[10px] font-medium">{s.unit}</span>
                    </p>
                  </div>
                  <div className="rounded-md bg-white/60 p-2 border border-black/5">
                    <p className="text-[9px] font-bold uppercase text-neutral-500">Threshold</p>
                    <p className="text-lg font-black text-neutral-900 leading-none opacity-60">
                      {s.threshold} <span className="text-[10px] font-medium">{s.unit}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> DANGER ZONE
                    </span>
                    <span className="font-mono text-neutral-500">{s.associated_layer}</span>
                  </div>
                  <div className="mt-1 flex flex-col">
                    <p className="text-[10px] font-medium text-neutral-700 truncate">GUID: {s.guid}</p>
                    <p className="text-[10px] font-mono font-bold text-neutral-800">
                      LOC: {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Incident Reporting Modal */}
      {reportingSensor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            
            {!showSuccess ? (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between bg-neutral-900 px-6 py-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-rose-500 p-1.5 animate-pulse">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-widest">Raise Incident</h2>
                      <p className="text-[10px] text-neutral-400 font-mono">UID: {reportingSensor.sensor_uid}</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="rounded-full p-1 transition-colors hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleReportSubmit} className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Assigned To</label>
                        <div className="rounded border bg-neutral-50 px-3 py-2 text-xs font-bold text-blue-600">
                          Finley Admin
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Priority</label>
                        <div className={cn(
                          "rounded border px-3 py-2 text-xs font-bold text-center capitalize",
                          reportingSensor.criticality === 'Critical' ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {reportingSensor.criticality}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Target Asset GUID</label>
                      <div className="rounded border bg-neutral-50 px-3 py-2 text-[11px] font-mono text-neutral-700 truncate">
                        {reportingSensor.guid}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Issue Summary</label>
                      <textarea 
                        required
                        className="w-full rounded border border-neutral-200 p-3 text-xs leading-relaxed text-neutral-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        rows={4}
                        defaultValue={`System Detection: ${reportingSensor.defect_type}. \nAsset: ${reportingSensor.sensor_name} shows an out-of-bounds value of ${reportingSensor.current_value} ${reportingSensor.unit}.`}
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            SUBMIT INCIDENT
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              /* Success View */
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in zoom-in-90 duration-300">
                <div className="mb-4 rounded-full bg-emerald-100 p-4 text-emerald-600 ring-8 ring-emerald-50">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900">Incident Reported</h2>
                <p className="mt-2 text-sm text-neutral-500">
                  The ticket for <span className="font-bold text-neutral-700">{reportingSensor.sensor_uid}</span> has been dispatched to <span className="font-semibold text-blue-600">Finley Admin</span>.
                </p>
                <div className="mt-8 flex items-center gap-2">
                  <div className="h-1.5 w-12 rounded-full bg-emerald-500" />
                  <div className="h-1.5 w-1.5 rounded-full bg-neutral-200" />
                  <div className="h-1.5 w-1.5 rounded-full bg-neutral-200" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}