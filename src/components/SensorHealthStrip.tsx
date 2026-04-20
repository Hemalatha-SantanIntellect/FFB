import { Activity, Filter, LayoutGrid, Rows3, Siren, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import sensorData from '@/data/fin_sensor.json'

const CRITICALITY_TONES: Record<string, string> = {
  Critical: 'bg-rose-600 text-white',
  High: 'bg-amber-600 text-white',
  Medium: 'bg-sky-600 text-white',
  Low: 'bg-emerald-600 text-white',
}

export function SensorHealthStrip() {
  const [selectedLayer, setSelectedLayer] = useState('All Layers')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [incidentToasts, setIncidentToasts] = useState<Array<{
    id: number
    sensorName: string
    sensorUid: string
    layer: string
    severity: string
  }>>([])
  const incidentToastTimeoutsRef = useRef<Map<number, number>>(new Map())

  const layerOptions = useMemo(() => {
    const layers = Array.from(new Set(sensorData.map((sensor) => sensor.associated_layer))).sort()
    return ['All Layers', ...layers]
  }, [])

  const filteredSensors = useMemo(() => {
    if (selectedLayer === 'All Layers') return sensorData
    return sensorData.filter((sensor) => sensor.associated_layer === selectedLayer)
  }, [selectedLayer])

  const totals = useMemo(() => {
    return filteredSensors.reduce(
      (acc, sensor) => {
        acc.sensors += 1
        if (sensor.criticality === 'Critical') acc.critical += 1
        if (sensor.criticality === 'High') acc.high += 1
        if (sensor.criticality === 'Medium') acc.medium += 1
        if (sensor.criticality === 'Low') acc.low += 1
        return acc
      },
      { sensors: 0, critical: 0, high: 0, medium: 0, low: 0 },
    )
  }, [filteredSensors])

  const dismissIncidentToast = (toastId: number) => {
    const timeoutId = incidentToastTimeoutsRef.current.get(toastId)
    if (timeoutId) {
      window.clearTimeout(timeoutId)
      incidentToastTimeoutsRef.current.delete(toastId)
    }
    setIncidentToasts((prev) => prev.filter((toast) => toast.id !== toastId))
  }

  const reportIncident = (sensor: (typeof sensorData)[number]) => {
    const toastId = Date.now() + Math.floor(Math.random() * 1000)
    setIncidentToasts((prev) => [
      ...prev,
      {
        id: toastId,
        sensorName: sensor.sensor_name,
        sensorUid: sensor.sensor_uid,
        layer: sensor.associated_layer.replace(/_/g, ' '),
        severity: sensor.criticality,
      },
    ])

    const timeoutId = window.setTimeout(() => {
      setIncidentToasts((prev) => prev.filter((toast) => toast.id !== toastId))
      incidentToastTimeoutsRef.current.delete(toastId)
    }, 2000)

    incidentToastTimeoutsRef.current.set(toastId, timeoutId)
  }

  useEffect(() => {
    return () => {
      incidentToastTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      incidentToastTimeoutsRef.current.clear()
    }
  }, [])

  return (
    <div className="fc-panel flex flex-col gap-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-600" />
          <h3 className="fc-eyebrow text-[11px]">All Sensors</h3>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <label
            htmlFor="sensor-layer-filter"
            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500"
          >
            <Filter className="h-3.5 w-3.5" />
            Category
          </label>
          <select
            id="sensor-layer-filter"
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            {layerOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded px-2 py-1 ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded px-2 py-1 ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              aria-label="List view"
            >
              <Rows3 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sensors</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{totals.sensors}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Critical</p>
          <p className="mt-1 text-lg font-semibold text-rose-700">{totals.critical}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">High</p>
          <p className="mt-1 text-lg font-semibold text-amber-700">{totals.high}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Medium</p>
          <p className="mt-1 text-lg font-semibold text-sky-700">{totals.medium}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Low</p>
          <p className="mt-1 text-lg font-semibold text-emerald-700">{totals.low}</p>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filteredSensors.map((sensor) => (
            <Card key={sensor.sensor_uid} className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-800">{sensor.sensor_uid}</p>
                  <p className="truncate text-sm font-medium text-slate-700">{sensor.sensor_name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className={`text-[9px] font-semibold ${CRITICALITY_TONES[sensor.criticality] ?? 'bg-slate-600 text-white'}`}>
                    {sensor.criticality}
                  </Badge>
                  <div className="group relative inline-flex">
                    <button
                      type="button"
                      onClick={() => reportIncident(sensor)}
                      className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 p-1 text-rose-600 transition-colors hover:bg-rose-100"
                      title="Report incident"
                      aria-label={`Report incident for ${sensor.sensor_name}`}
                    >
                      <Siren className="h-3 w-3" />
                    </button>
                    <span className="pointer-events-none absolute top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover:block">
                      Report incident
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">Layer</p>
                  <p className="truncate font-medium text-slate-700">{sensor.associated_layer.replace(/_/g, ' ')}</p>
                </div>
                <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">Defect</p>
                  <p className="truncate font-medium text-slate-700">{sensor.defect_type}</p>
                </div>
                <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">Current</p>
                  <p className="font-semibold text-slate-800">{sensor.current_value} {sensor.unit}</p>
                </div>
                <div className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5">
                  <p className="text-[9px] font-semibold uppercase text-slate-500">Threshold</p>
                  <p className="font-medium text-slate-700">{sensor.threshold} {sensor.unit}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              All Sensors
            </p>
            <p className="text-[11px] font-semibold text-slate-700">
              {filteredSensors.length} sensors
            </p>
          </div>

          <div className="max-h-[360px] overflow-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[160px_minmax(220px,1fr)_140px_120px_120px_120px_100px] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sensor UID</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sensor Name</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Layer</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Threshold</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Severity</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</p>
              </div>

              {filteredSensors.map((sensor) => (
                <div
                  key={sensor.sensor_uid}
                  className="grid grid-cols-[160px_minmax(220px,1fr)_140px_120px_120px_120px_100px] gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0"
                >
                  <p className="truncate text-[11px] font-semibold text-slate-800">{sensor.sensor_uid}</p>
                  <p className="truncate text-[11px] font-medium text-slate-800">{sensor.sensor_name}</p>
                  <p className="truncate text-[11px] font-medium text-slate-600">
                    {sensor.associated_layer.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-800">
                    {sensor.current_value} {sensor.unit}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600">
                    {sensor.threshold} {sensor.unit}
                  </p>
                  <div>
                    <Badge className={`text-[9px] font-semibold ${CRITICALITY_TONES[sensor.criticality] ?? 'bg-slate-600 text-white'}`}>
                      {sensor.criticality}
                    </Badge>
                  </div>
                  <div>
                    <div className="group relative inline-flex">
                      <button
                        type="button"
                        onClick={() => reportIncident(sensor)}
                        className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100"
                        title="Report incident"
                        aria-label={`Report incident for ${sensor.sensor_name}`}
                      >
                        <Siren className="h-3.5 w-3.5" />
                      </button>
                      <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover:block">
                        Report incident
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {filteredSensors.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <p className="text-[12px] font-medium text-slate-600">
            No sensors found for this category.
          </p>
        </div>
      )}

      {incidentToasts.length > 0 && (
        <div className="pointer-events-none fixed right-6 top-6 z-50 flex w-[320px] flex-col gap-2">
          {incidentToasts.map((incidentToast) => (
            <div
              key={incidentToast.id}
              className="pointer-events-auto rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-800">Incident report submitted successfully.</p>
                  <p className="mt-1 text-[10px] font-medium text-emerald-700">
                    Sensor {incidentToast.sensorName} ({incidentToast.sensorUid}) in {incidentToast.layer} layer with{' '}
                    {incidentToast.severity} severity has been logged.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissIncidentToast(incidentToast.id)}
                  className="rounded p-1 text-emerald-700 transition-colors hover:bg-emerald-100"
                  aria-label="Close incident notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}