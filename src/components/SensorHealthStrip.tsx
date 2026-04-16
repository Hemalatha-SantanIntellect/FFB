import { 
  Activity, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Wind, 
  Zap, 
  Gauge, 
  MapPin,
  Construction
} from 'lucide-react'
import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// Data Imports
import fundingData from '@/data/fin_funding.json'
import sensorData from '@/data/fin_sensor.json' // Assuming you saved the sensor JSON here

const CRITICALITY_THEMES = {
  Critical: 'border-l-rose-500 bg-rose-50/50 text-rose-700 icon-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
  High: 'border-l-orange-500 bg-orange-50/50 text-orange-700 icon-orange-600',
  Medium: 'border-l-amber-500 bg-amber-50/50 text-amber-700 icon-amber-600',
  Low: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-700 icon-emerald-600',
}

// Map sensor types to appropriate icons
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
  // Merge Sensor Health with Funding Data to find GUID and Coordinates
  const enrichedSensors = useMemo(() => {
    return sensorData.map((sensor) => {
      let assetInfo = { guid: 'N/A', lat: 0, lng: 0, rid: 'N/A' }
      
      // Look up in funding JSON based on associated_layer
      const layerAssets = fundingData[sensor.associated_layer as keyof typeof fundingData] || []
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
        {enrichedSensors.map((s, idx) => {
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
              {/* Splash Effect on Hover */}
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
                  <Badge className={cn("text-[9px] font-bold", s.criticality === 'Critical' ? "bg-rose-600" : "bg-neutral-800")}>
                    {s.criticality}
                  </Badge>
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

                <div className="mt-3">
                   <p className="text-[10px] font-bold text-neutral-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    DETECTION: <span className="text-neutral-900">{s.defect_type}</span>
                  </p>
                </div>

                {/* Danger Zone / Location Data */}
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
    </div>
  )
}