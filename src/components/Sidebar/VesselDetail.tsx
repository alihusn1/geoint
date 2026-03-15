import { Ship, Navigation } from 'lucide-react'
import type { VesselState } from '@/types/live'

export function VesselDetail({ vessel }: { vessel: VesselState }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Ship size={18} className="text-blue-400" />
        <h3 className="text-lg font-semibold text-white">{vessel.name || 'Unknown Vessel'}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="MMSI" value={vessel.mmsi} />
        <InfoItem label="Vessel Type" value={vessel.vesselType} />
        <InfoItem label="Speed" value={`${vessel.speed.toFixed(1)} kn`} />
        <InfoItem label="Heading" value={`${Math.round(vessel.heading)}°`} icon={<Navigation size={12} />} />
        <InfoItem label="Latitude" value={`${vessel.lat.toFixed(4)}°`} />
        <InfoItem label="Longitude" value={`${vessel.lng.toFixed(4)}°`} />
        <InfoItem label="Destination" value={vessel.destination ?? 'Unknown'} />
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
