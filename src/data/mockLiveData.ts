import type {
  AircraftState,
  SatellitePosition,
  JammingPoint,
  VesselState,
  AirspaceRestriction,
  StrikeEvent,
  FrontlineData,
} from '@/types/live'
import { getSatelliteColor } from '@/utils/liveColors'

// ── Mock Aircraft (50) ──
const CALLSIGN_PREFIXES = ['UAL', 'DAL', 'AAL', 'BAW', 'DLH', 'AFR', 'RYR', 'THY', 'UAE', 'SIA']
const COUNTRIES = ['United States', 'United Kingdom', 'Germany', 'France', 'Turkey', 'UAE', 'China', 'Russia', 'India', 'Japan']

function randomLat() { return (Math.random() * 140) - 70 }
function randomLng() { return (Math.random() * 360) - 180 }
function randomBetween(a: number, b: number) { return a + Math.random() * (b - a) }

export function generateMockAircraft(count = 50): AircraftState[] {
  return Array.from({ length: count }, (_, i) => {
    const cat: AircraftState['category'] =
      i < 3 ? 'military' : i === 3 ? 'emergency' : 'commercial'
    return {
      icao24: `${(0xa00000 + i).toString(16)}`,
      callsign: `${CALLSIGN_PREFIXES[i % CALLSIGN_PREFIXES.length]}${100 + i}`,
      originCountry: COUNTRIES[i % COUNTRIES.length],
      lat: randomLat(),
      lng: randomLng(),
      altitude: randomBetween(8000, 12000),
      velocity: randomBetween(200, 280),
      heading: Math.random() * 360,
      verticalRate: randomBetween(-5, 5),
      onGround: false,
      lastContact: Date.now() / 1000,
      squawk: cat === 'emergency' ? '7700' : null,
      category: cat,
    }
  })
}

// ── Mock FlightAware (20) ──
const FA_CALLSIGNS = ['SWA', 'JBU', 'SKW', 'ENY', 'ASA', 'FFT', 'NKS', 'AAY', 'VRD', 'FDX']

export function generateMockFlightaware(count = 20): AircraftState[] {
  return Array.from({ length: count }, (_, i) => ({
    icao24: `FA-${(0xb00000 + i).toString(16)}`,
    callsign: `${FA_CALLSIGNS[i % FA_CALLSIGNS.length]}${200 + i}`,
    originCountry: COUNTRIES[i % COUNTRIES.length],
    lat: randomLat(),
    lng: randomLng(),
    altitude: randomBetween(6000, 12000),
    velocity: randomBetween(180, 260),
    heading: Math.random() * 360,
    verticalRate: randomBetween(-3, 3),
    onGround: false,
    lastContact: Date.now() / 1000,
    squawk: null,
    category: 'commercial' as const,
  }))
}

// ── Mock Satellites (20) ──
const SAT_NAMES = ['ISS', 'NOAA-19', 'GPS IIR-M', 'USA-245', 'GOES-16', 'DMSP-F19', 'GPS IIF-12', 'SAPPHIRE', 'Tiangong', 'NOAA-20']
const SAT_CATEGORIES: SatellitePosition['category'][] = ['stations', 'weather', 'gps-ops', 'military', 'weather', 'weather', 'gps-ops', 'military', 'stations', 'weather']

export function generateMockSatellites(count = 20): SatellitePosition[] {
  return Array.from({ length: count }, (_, i) => {
    const category = SAT_CATEGORIES[i % SAT_CATEGORIES.length]
    return {
      noradId: 25544 + i,
      name: i < SAT_NAMES.length ? SAT_NAMES[i] : `SAT-${i}`,
      lat: randomLat(),
      lng: randomLng(),
      altKm: randomBetween(400, 36000),
      velocity: randomBetween(3, 8),
      category,
      color: getSatelliteColor(category),
      orbitPath: Array.from({ length: 60 }, (_, j) => [
        randomLat() + Math.sin(j * 0.1) * 30,
        randomLng() + j * 6,
      ] as [number, number]),
    }
  })
}

// ── Mock GPS Jamming Grid (30 points) ──
export function generateMockJamming(): JammingPoint[] {
  // Cluster around known hotspots: Eastern Mediterranean, Middle East, Ukraine
  const hotspots = [
    { lat: 34.5, lng: 35.5 }, // Lebanon/Syria
    { lat: 48.5, lng: 37.5 }, // Eastern Ukraine
    { lat: 32.0, lng: 54.0 }, // Iran
  ]
  const points: JammingPoint[] = []
  for (const hs of hotspots) {
    for (let j = 0; j < 10; j++) {
      points.push({
        lat: hs.lat + randomBetween(-3, 3),
        lng: hs.lng + randomBetween(-3, 3),
        intensity: randomBetween(0.3, 1.0),
      })
    }
  }
  return points
}

// ── Mock Maritime Vessels (30) ──
const VESSEL_NAMES = ['Maersk Aurora', 'CMA CGM Liberty', 'USNS Comfort', 'Ever Given', 'Carnival Dream', 'Pacific Fisher', 'Nordic Tanker', 'Oceanic Carrier', 'HMS Defender', 'Admiral Kuznetsov']
const VESSEL_TYPES: VesselState['vesselType'][] = ['cargo', 'cargo', 'military', 'cargo', 'passenger', 'fishing', 'tanker', 'cargo', 'military', 'military']

export function generateMockVessels(count = 30): VesselState[] {
  // Cluster at chokepoints: Strait of Hormuz, Suez, Malacca, Bosphorus
  const chokepoints = [
    { lat: 26.5, lng: 56.2 }, // Hormuz
    { lat: 30.0, lng: 32.5 }, // Suez
    { lat: 1.3, lng: 103.8 }, // Malacca
    { lat: 41.0, lng: 29.0 }, // Bosphorus
  ]
  return Array.from({ length: count }, (_, i) => {
    const cp = chokepoints[i % chokepoints.length]
    return {
      mmsi: `${200000000 + i}`,
      name: i < VESSEL_NAMES.length ? VESSEL_NAMES[i] : `VESSEL-${i}`,
      lat: cp.lat + randomBetween(-2, 2),
      lng: cp.lng + randomBetween(-2, 2),
      heading: Math.random() * 360,
      speed: randomBetween(5, 22),
      vesselType: VESSEL_TYPES[i % VESSEL_TYPES.length],
      destination: 'Port Unknown',
    }
  })
}

// ── Mock MarineTraffic Vessels (25) ──
const MT_VESSEL_NAMES = ['MSC Fantasia', 'OOCL Hong Kong', 'Stena Impero', 'Blue Marlin', 'Akademik Shokalskiy', 'NS Concord', 'Hai Yang Shi You', 'Nisshin Maru', 'RMS Queen Mary', 'USS Nimitz']
const MT_VESSEL_TYPES: VesselState['vesselType'][] = ['cargo', 'cargo', 'tanker', 'cargo', 'passenger', 'tanker', 'fishing', 'fishing', 'passenger', 'military']

export function generateMockMarineTraffic(count = 25): VesselState[] {
  const areas = [
    { lat: 34.0, lng: -6.0 },   // Strait of Gibraltar
    { lat: 12.0, lng: 43.0 },   // Bab el-Mandeb
    { lat: 51.0, lng: 1.5 },    // English Channel
    { lat: -34.0, lng: 18.5 },  // Cape of Good Hope
  ]
  return Array.from({ length: count }, (_, i) => {
    const area = areas[i % areas.length]
    return {
      mmsi: `${300000000 + i}`,
      name: i < MT_VESSEL_NAMES.length ? MT_VESSEL_NAMES[i] : `MT-VESSEL-${i}`,
      lat: area.lat + randomBetween(-3, 3),
      lng: area.lng + randomBetween(-3, 3),
      heading: Math.random() * 360,
      speed: randomBetween(3, 20),
      vesselType: MT_VESSEL_TYPES[i % MT_VESSEL_TYPES.length],
      destination: 'Port Unknown',
    }
  })
}

// ── Mock No-Fly Zones (5) ──
export function generateMockAirspace(): AirspaceRestriction[] {
  return [
    {
      id: 'nfz-1',
      type: 'CONFLICT_ZONE',
      label: 'Eastern Ukraine Conflict Zone',
      geometry: [[[36, 47], [40, 47], [40, 50], [36, 50], [36, 47]]],
      fillColor: 'rgba(230, 57, 70, 0.15)',
      strokeColor: '#E63946',
      effective: '2022-02-24',
    },
    {
      id: 'nfz-2',
      type: 'PROHIBITED',
      label: 'Syrian Airspace',
      geometry: [[[35.5, 32.3], [42.4, 32.3], [42.4, 37.3], [35.5, 37.3], [35.5, 32.3]]],
      fillColor: 'rgba(247, 127, 0, 0.15)',
      strokeColor: '#F77F00',
      effective: '2015-09-30',
    },
    {
      id: 'nfz-3',
      type: 'TFR',
      label: 'Tehran TFR',
      geometry: [[[51.0, 35.5], [51.8, 35.5], [51.8, 35.9], [51.0, 35.9], [51.0, 35.5]]],
      fillColor: 'rgba(247, 127, 0, 0.15)',
      strokeColor: '#F77F00',
      effective: null,
    },
    {
      id: 'nfz-4',
      type: 'MOA',
      label: 'Nellis Range Complex',
      geometry: [[[-116.5, 36.5], [-115, 36.5], [-115, 37.5], [-116.5, 37.5], [-116.5, 36.5]]],
      fillColor: 'rgba(155, 93, 229, 0.15)',
      strokeColor: '#9B5DE5',
      effective: null,
    },
    {
      id: 'nfz-5',
      type: 'RESTRICTED',
      label: 'North Korea Airspace',
      geometry: [[[124, 37.5], [131, 37.5], [131, 43], [124, 43], [124, 37.5]]],
      fillColor: 'rgba(230, 57, 70, 0.15)',
      strokeColor: '#E63946',
      effective: null,
    },
  ]
}

// ── Mock Strikes (10) ──
export function generateMockStrikes(): StrikeEvent[] {
  const strikes: Partial<StrikeEvent>[] = [
    { lat: 48.8, lng: 37.9, eventType: 'artillery', description: 'Artillery strike reported near Donetsk', blastRadiusKm: 2 },
    { lat: 34.4, lng: 35.8, eventType: 'airstrike', description: 'Airstrike in northern Lebanon', blastRadiusKm: 1.5 },
    { lat: 33.5, lng: 36.3, eventType: 'airstrike', description: 'Strike near Damascus suburbs', blastRadiusKm: 3 },
    { lat: 36.2, lng: 37.1, eventType: 'artillery', description: 'Artillery exchange near Aleppo', blastRadiusKm: 1 },
    { lat: 15.4, lng: 44.2, eventType: 'drone', description: 'Drone strike in Yemen', blastRadiusKm: 0.5 },
    { lat: 32.0, lng: 34.8, eventType: 'missile', description: 'Missile intercepted over Tel Aviv', blastRadiusKm: 5, origin: { lat: 33.8, lng: 35.9, label: 'Lebanon' } },
    { lat: 47.0, lng: 36.0, eventType: 'missile', description: 'Cruise missile strike near Mariupol', blastRadiusKm: 4, origin: { lat: 45.0, lng: 39.0, label: 'Krasnodar' } },
    { lat: 50.4, lng: 30.5, eventType: 'drone', description: 'Shahed drone over Kyiv', blastRadiusKm: 1, origin: { lat: 46.0, lng: 36.0, label: 'Crimea' } },
    { lat: 31.9, lng: 35.2, eventType: 'airstrike', description: 'Airstrike near West Bank', blastRadiusKm: 1 },
    { lat: 12.8, lng: 45.0, eventType: 'naval', description: 'Naval engagement Gulf of Aden', blastRadiusKm: 2 },
  ]
  return strikes.map((s, i) => ({
    id: `strike-${i}`,
    lat: s.lat!,
    lng: s.lng!,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    eventType: s.eventType!,
    confidence: randomBetween(0.6, 1.0),
    source: 'mock',
    description: s.description!,
    blastRadiusKm: s.blastRadiusKm!,
    origin: s.origin ?? null,
    sources: ['mock-osint'],
  }))
}

// ── Mock Frontlines ──
export function generateMockFrontlines(): FrontlineData[] {
  return []
}
