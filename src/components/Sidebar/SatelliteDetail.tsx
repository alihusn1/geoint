import { Satellite, ArrowUpDown, Gauge, Globe, MapPin, Radio, CircleDot } from 'lucide-react'
import type { SatellitePosition } from '@/types/live'
import { getSatelliteColor } from '@/utils/liveColors'

const EARTH_R = 6371 // km

function getOrbitType(altKm: number): string {
  if (altKm < 2000) return 'LEO'
  if (altKm < 35786) return 'MEO'
  return 'GEO'
}

function getFootprintRadiusKm(altKm: number): number {
  const theta = Math.acos(EARTH_R / (EARTH_R + altKm))
  return EARTH_R * theta
}

function getOrbitalPeriodMin(altKm: number): number {
  const a = EARTH_R + altKm
  return 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / 398600.4) / 60
}

const CATEGORY_LABELS: Record<SatellitePosition['category'], string> = {
  military: 'Military',
  recon: 'Reconnaissance',
  stations: 'Space Station',
  station: 'Space Station',
  'gps-ops': 'GPS Ops',
  navigation: 'Navigation',
  weather: 'Weather / Earth Obs',
  comms: 'Communications',
  science: 'Science',
  other: 'Other',
}

export function SatelliteDetail({ satellite }: { satellite: SatellitePosition }) {
  const color = getSatelliteColor(satellite.category)
  const footprintKm = getFootprintRadiusKm(satellite.altKm)
  const periodMin = getOrbitalPeriodMin(satellite.altKm)
  const orbitType = getOrbitType(satellite.altKm)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Satellite size={18} style={{ color }} />
        <h3 className="text-lg font-semibold text-white">{satellite.name}</h3>
        <span
          className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
        >
          {orbitType}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="NORAD ID" value={String(satellite.noradId)} icon={<CircleDot size={12} />} />
        <InfoItem label="Category" value={CATEGORY_LABELS[satellite.category]} icon={<Radio size={12} />} />
        <InfoItem label="Altitude" value={`${Math.round(satellite.altKm).toLocaleString()} km`} icon={<ArrowUpDown size={12} />} />
        <InfoItem label="Velocity" value={`${satellite.velocity.toFixed(1)} km/s`} icon={<Gauge size={12} />} />
        <InfoItem label="Latitude" value={`${satellite.lat.toFixed(2)}°`} icon={<MapPin size={12} />} />
        <InfoItem label="Longitude" value={`${satellite.lng.toFixed(2)}°`} icon={<Globe size={12} />} />
        <InfoItem label="Footprint" value={`${Math.round(footprintKm).toLocaleString()} km`} icon={<Radio size={12} />} />
        <InfoItem label="Orbital Period" value={`${periodMin.toFixed(0)} min`} icon={<Satellite size={12} />} />
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
