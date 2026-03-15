import { Plane, Navigation, ArrowUpDown, AlertTriangle } from 'lucide-react'
import type { AircraftState } from '@/types/live'

export function AircraftDetail({ aircraft }: { aircraft: AircraftState }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Plane size={18} className="text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">{aircraft.callsign || 'Unknown'}</h3>
      </div>

      {aircraft.squawk === '7700' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          <AlertTriangle size={14} />
          Emergency (Squawk 7700)
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="ICAO24" value={aircraft.icao24} />
        <InfoItem label="Callsign" value={aircraft.callsign || '—'} />
        <InfoItem label="Country" value={aircraft.originCountry} />
        <InfoItem label="Category" value={aircraft.category} />
        <InfoItem label="Altitude" value={`${Math.round(aircraft.altitude).toLocaleString()} m`} icon={<ArrowUpDown size={12} />} />
        <InfoItem label="Speed" value={`${Math.round(aircraft.velocity)} m/s`} />
        <InfoItem label="Heading" value={`${Math.round(aircraft.heading)}°`} icon={<Navigation size={12} />} />
        <InfoItem label="Vertical Rate" value={`${aircraft.verticalRate.toFixed(1)} m/s`} />
        <InfoItem label="Squawk" value={aircraft.squawk ?? '—'} />
        <InfoItem label="On Ground" value={aircraft.onGround ? 'Yes' : 'No'} />
      </div>
    </div>
  )
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="px-3 py-2 bg-surface-300 rounded border border-navy-700">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-sm text-white flex items-center gap-1">
        {icon}{value}
      </div>
    </div>
  )
}
