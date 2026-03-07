# GeoINT Globe — Phase 1: Frontend Development

## Project Overview

Build an interactive 3D globe application that visualizes military installations and OSINT intelligence feeds. This phase uses **dummy/mock data** to develop the complete UI. The backend integration happens in Phase 3.

## Tech Stack

- **Framework**: React 18 + Vite + **TypeScript**
- **3D Globe**: `react-globe.gl` (Globe.gl React wrapper)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios (pre-configured for Phase 3)
- **Language**: Strict TypeScript throughout — all components, stores, hooks, and utils must be fully typed with interfaces/types. No `any` types.

## Project Structure

```
geoint-globe/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                  # Tailwind imports + global styles
│   │
│   ├── components/
│   │   ├── Globe/
│   │   │   ├── GlobeView.tsx       # Main 3D globe component
│   │   │   ├── GlobeControls.tsx   # Zoom, rotate, reset buttons
│   │   │   └── MarkerTooltip.tsx   # Hover tooltip for markers
│   │   │
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx          # Main sidebar container (collapsible)
│   │   │   ├── BaseDetail.tsx       # Military base detail panel
│   │   │   ├── EventDetail.tsx      # OSINT event detail panel
│   │   │   └── CountryProfile.tsx   # Country summary card
│   │   │
│   │   ├── Filters/
│   │   │   ├── FilterPanel.tsx      # Main filter container
│   │   │   ├── CountryFilter.tsx    # Country multi-select dropdown
│   │   │   ├── BaseTypeFilter.tsx   # Base type checkboxes
│   │   │   ├── BranchFilter.tsx     # Military branch toggles
│   │   │   └── DateRangeFilter.tsx  # Date range picker for events
│   │   │
│   │   ├── Dashboard/
│   │   │   ├── StatsBar.tsx         # Top stats bar (total bases, events, countries)
│   │   │   ├── EventTimeline.tsx    # Recharts timeline of events
│   │   │   └── EventFeed.tsx        # Scrollable OSINT event list
│   │   │
│   │   ├── Search/
│   │   │   └── SearchBar.tsx        # Global search with autocomplete
│   │   │
│   │   └── Layout/
│   │       ├── Header.tsx           # App header with logo + search
│   │       └── StatusIndicator.tsx  # Online/Offline mode badge
│   │
│   ├── store/
│   │   ├── useGlobeStore.ts         # Globe state (camera, selected marker)
│   │   ├── useFilterStore.ts        # Active filters state
│   │   └── useDataStore.ts          # Bases, events, loading states
│   │
│   ├── data/
│   │   ├── mockBases.ts             # 50+ dummy military bases
│   │   ├── mockEvents.ts            # 30+ dummy OSINT events
│   │   └── countries.ts             # Country list with codes + coords
│   │
│   ├── services/
│   │   └── api.ts                   # Axios instance (points to localhost:8000 for Phase 3)
│   │
│   ├── types/
│   │   ├── base.ts                  # MilitaryBase, BaseType, Branch interfaces
│   │   ├── event.ts                 # OSINTEvent, EventCategory, Severity interfaces
│   │   ├── filters.ts               # FilterState interface
│   │   └── globe.ts                 # GlobeState, CameraPosition interfaces
│   │
│   ├── hooks/
│   │   ├── useFilteredData.ts       # Memoized filtered bases/events
│   │   └── useGlobeInteraction.ts   # Globe click/hover handlers
│   │
│   └── utils/
│       ├── colors.ts                # Color map for base types
│       ├── geo.ts                   # Haversine distance, bounding box utils
│       └── formatters.ts            # Date, number formatters
│
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
└── README.md
```

## TypeScript Interfaces

Define these in `src/types/` and import everywhere. No inline type definitions.

```typescript
// src/types/base.ts
export type BaseType = 'airfield' | 'naval' | 'army' | 'nuclear' | 'joint' | 'missile' | 'intelligence' | 'training' | 'barracks' | 'range';
export type Branch = 'Army' | 'Navy' | 'Air Force' | 'Marines' | 'Joint' | 'Other';
export type OperationalStatus = 'active' | 'inactive' | 'unknown';
export type DataSource = 'dod' | 'osm' | 'wikipedia';

export interface MilitaryBase {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  type: BaseType;
  branch: Branch;
  status: OperationalStatus;
  component: string;
  description: string;
  source: DataSource;
  lastUpdated: string;
}

// src/types/event.ts
export type EventSource = 'gdelt' | 'twitter' | 'rss';
export type EventCategory = 'military' | 'conflict' | 'diplomacy' | 'exercise' | 'humanitarian';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface OSINTEvent {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  country: string;
  countryCode: string | null;
  source: EventSource;
  sourceUrl: string;
  category: EventCategory;
  severity: Severity;
  timestamp: string;
  relatedBaseIds: string[];
}

// src/types/filters.ts
export interface FilterState {
  countries: string[];
  baseTypes: BaseType[];
  branches: Branch[];
  status: OperationalStatus | 'all';
  dateRange: { from: string | null; to: string | null };
  searchQuery: string;
}

// src/types/globe.ts
export interface CameraPosition {
  lat: number;
  lng: number;
  altitude: number;
}
```

## Setup Commands

```bash
npm create vite@latest geoint-globe -- --template react-ts
cd geoint-globe
npm install react-globe.gl three zustand axios recharts lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

## Design System

### Color Palette (Dark Intelligence Theme)

```typescript
// tailwind.config.ts extend colors
const colors = {
  navy:     { 900: '#0C1B2A', 800: '#132D46', 700: '#1B3A5C' },
  cyan:     { 500: '#00B4D8', 600: '#0077B6', 400: '#48CAE4' },
  slate:    { 500: '#8B9EB0', 600: '#4A5E73', 700: '#334155' },
  alert:    { red: '#E63946', green: '#2EC4B6', orange: '#F4A261' },
  surface:  { card: '#162D44', border: '#1E3A5F' },
};
```

### Typography

- **Headers**: `font-bold text-white` — use Trebuchet MS or system sans
- **Body**: `text-slate-300` — Calibri fallback to system sans
- **Labels**: `text-xs uppercase tracking-wider text-slate-500`

### Layout

- Full viewport height (`h-screen`), no scrolling on main layout
- Globe occupies ~70% width, sidebar ~30% (collapsible)
- Header: fixed top, 48px height, dark background
- Filter panel: overlay from left side, slides in/out

## Component Specifications

### 1. GlobeView.tsx (Core Component)

```
Props: none (reads from Zustand stores)
Behavior:
  - Renders react-globe.gl with dark theme
  - Globe background: '#0C1B2A' (match app bg)
  - Atmosphere: enabled, color cyan-500
  - Points layer for military bases:
    - pointLat / pointLng from base data
    - pointColor: mapped by base type (see Color Map below)
    - pointRadius: 0.3 for bases, 0.15 for small markers
    - pointAltitude: 0.01
    - onPointClick: select base → open sidebar
    - onPointHover: show tooltip
  - Points layer for OSINT events (separate layer):
    - color: '#E63946' (red) with pulsing animation
    - pointRadius: 0.2
    - pointAltitude: 0.02 (float above bases)
  - Arcs layer for recent events:
    - arcStartLat/Lng: event location
    - arcEndLat/Lng: slightly offset (visual effect)
    - arcColor: ['#E63946', '#F4A261']
    - arcDashLength: 0.5
    - arcDashGap: 0.2
    - arcDashAnimateTime: 2000
  - Labels layer (optional):
    - Show country names at zoom > threshold
  - Camera:
    - Initial position: lat 30, lng 30, altitude 2.5
    - On base click: animate to base position (altitude 0.5)
    - Store camera state in useGlobeStore
```

### Base Type Color Map

```typescript
export const BASE_COLORS = {
  airfield:    '#00B4D8', // cyan
  naval:       '#0077B6', // deep blue
  army:        '#2EC4B6', // teal
  nuclear:     '#E63946', // red
  joint:       '#F4A261', // orange
  missile:     '#9B5DE5', // purple
  intelligence:'#F15BB5', // pink
  training:    '#8B9EB0', // gray
  default:     '#48CAE4', // light cyan
};
```

### 2. Sidebar.tsx

```
State: isOpen (boolean), activeTab ('base' | 'event' | 'country')
Behavior:
  - Slides in from right when a marker is clicked
  - Close button (X) top right
  - Tab bar at top: Base Info | OSINT Events | Country
  - Width: 380px fixed
  - Scrollable content area
  - Dark background matching app theme
```

### 3. BaseDetail.tsx

```
Props: base (object from store)
Displays:
  - Base name (h2, white, bold)
  - Country flag emoji + country name
  - Badge for base type (colored per type map)
  - Branch: Army / Navy / Air Force / Marines / Joint
  - Operational status: Active / Inactive / Unknown
  - Coordinates: lat, lng (copyable)
  - "View on Google Maps" external link
  - "Nearby Events" section: list of OSINT events within 200km
  - Satellite imagery placeholder (gray box with "Satellite View" text)
```

### 4. FilterPanel.tsx

```
Position: overlay on left side of globe, slides in/out
Toggle button: floating button with filter icon on left edge
Contains:
  - Country multi-select (searchable dropdown, max 300 countries)
  - Base Type checkboxes (all types from color map)
  - Branch toggles (Army, Navy, Air Force, Marines, Joint, Other)
  - Operational Status toggle (Active, Inactive, All)
  - Date range for events (from/to date inputs)
  - "Reset All" button at bottom
  - Active filter count badge on toggle button
All filter changes update useFilterStore → useFilteredData recomputes
```

### 5. StatsBar.tsx

```
Position: top bar below header, full width, height 60px
Displays 4 stat cards in a row:
  - Total Bases (filtered count / total)
  - Active Events (count)
  - Countries (unique count from filtered bases)
  - Last Updated (timestamp)
Each card: icon + large number + small label
Background: slightly lighter than app bg (#132D46)
```

### 6. EventTimeline.tsx

```
Uses Recharts AreaChart
Data: events grouped by date (last 30 days)
X-axis: dates
Y-axis: event count
Area fill: gradient from cyan-500 to transparent
Tooltip: date + count
Height: 200px
Click on data point: filter events to that date
```

### 7. EventFeed.tsx

```
Scrollable list in sidebar or dashboard panel
Each event card:
  - Red dot indicator (pulsing if < 1hr old)
  - Event title (bold, white)
  - Source badge (GDELT, Twitter, RSS)
  - Timestamp (relative: "2h ago", "3d ago")
  - Location text + country flag
  - 2-line description preview
  - Click → select event on globe + open detail
Max height: 400px, virtual scroll for performance
```

### 8. SearchBar.tsx

```
Position: in Header, center
Behavior:
  - Input with search icon, placeholder "Search bases, events, countries..."
  - Debounced search (300ms)
  - Dropdown with categorized results:
    - Bases: matching name
    - Countries: matching name
    - Events: matching title
  - Click result → navigate globe to location + select item
  - Keyboard navigation (up/down arrows, enter to select)
  - Escape to close dropdown
```

## Dummy Data Specifications

### mockBases.ts — Generate 50+ bases

Each base object:
```typescript
{
  id: "base_001",
  name: "Camp Humphreys",
  country: "South Korea",
  countryCode: "KR",
  lat: 36.9631,
  lng: 127.0312,
  type: "army",          // airfield | naval | army | nuclear | joint | missile | intelligence | training
  branch: "Army",        // Army | Navy | Air Force | Marines | Joint | Other
  status: "active",      // active | inactive | unknown
  component: "US Army",
  description: "Largest US military installation in South Korea, serves as USFK headquarters.",
  source: "dod",         // dod | osm | wikipedia
  lastUpdated: "2025-11-15"
}
```

**Include real-ish bases spread across these regions:**
- **Middle East** (10): Al Udeid, Al Dhafra, Camp Arifjan, Incirlik, etc.
- **East Asia** (10): Camp Humphreys, Kadena, Yokosuka, Misawa, Osan, etc.
- **Europe** (10): Ramstein, Aviano, Lakenheath, Rota, Grafenwöhr, etc.
- **Americas** (8): Fort Liberty, Norfolk, Pearl Harbor, Guantanamo, etc.
- **Africa** (5): Camp Lemonnier, Niamey, Agadez, etc.
- **Indo-Pacific** (7): Diego Garcia, Pine Gap, Changi, Darwin, Guam, etc.

Use realistic coordinates for all bases. The data should feel authentic.

### mockEvents.ts — Generate 30+ events

Each event object:
```typescript
{
  id: "evt_001",
  title: "Increased Naval Activity in South China Sea",
  description: "Multiple carrier groups detected transiting the Strait of Malacca...",
  lat: 10.5,
  lng: 114.0,
  country: "International Waters",
  countryCode: null,
  source: "gdelt",       // gdelt | twitter | rss
  sourceUrl: "https://example.com/article",
  category: "military",  // military | conflict | diplomacy | exercise | humanitarian
  severity: "medium",    // low | medium | high | critical
  timestamp: "2026-02-28T14:30:00Z",
  relatedBaseIds: ["base_025", "base_026"]
}
```

**Include events across these categories:**
- Naval movements and exercises (5)
- Air defense alerts and intercepts (5)
- Military exercises / deployments (5)
- Diplomatic tensions with military component (5)
- Conflict zone updates (Ukraine, Middle East) (5)
- Intelligence/cyber events (5)

### countries.ts

```typescript
// Top 50 countries with military significance
{
  code: "US",
  name: "United States",
  lat: 39.8283,
  lng: -98.5795,
  region: "Americas"
}
```

## Zustand Store Specs

### useGlobeStore.ts

```typescript
{
  // Camera
  cameraPosition: { lat: 30, lng: 30, altitude: 2.5 },
  setCameraPosition: (pos) => ...,
  
  // Selection
  selectedBase: null,        // base object or null
  selectedEvent: null,       // event object or null
  setSelectedBase: (base) => ...,
  setSelectedEvent: (event) => ...,
  clearSelection: () => ...,
  
  // Sidebar
  sidebarOpen: false,
  sidebarTab: 'base',       // 'base' | 'event' | 'country'
  setSidebarOpen: (open) => ...,
  setSidebarTab: (tab) => ...,
  
  // Globe settings
  showEvents: true,
  showArcs: true,
  toggleEvents: () => ...,
  toggleArcs: () => ...,
}
```

### useFilterStore.ts

```typescript
{
  countries: [],             // selected country codes, empty = all
  baseTypes: [],             // selected types, empty = all
  branches: [],              // selected branches, empty = all
  status: 'all',             // 'all' | 'active' | 'inactive'
  dateRange: { from: null, to: null },
  searchQuery: '',
  
  setCountries: (codes) => ...,
  setBaseTypes: (types) => ...,
  setBranches: (branches) => ...,
  setStatus: (status) => ...,
  setDateRange: (range) => ...,
  setSearchQuery: (query) => ...,
  resetFilters: () => ...,
  
  // Computed
  activeFilterCount: computed → number of non-default filters
}
```

### useDataStore.ts

```typescript
{
  bases: [],                  // all bases (from mock or API)
  events: [],                 // all events
  loading: false,
  error: null,
  lastUpdated: null,
  mode: 'offline',            // 'online' | 'offline'
  
  // Actions (Phase 1: load from mock, Phase 3: load from API)
  fetchBases: async () => ...,
  fetchEvents: async () => ...,
  setMode: (mode) => ...,
}
```

## Hooks

### useFilteredData.ts

```typescript
// Returns memoized filtered data based on active filters
export function useFilteredData() {
  const bases = useDataStore(s => s.bases);
  const events = useDataStore(s => s.events);
  const filters = useFilterStore();
  
  const filteredBases = useMemo(() => {
    return bases.filter(base => {
      if (filters.countries.length && !filters.countries.includes(base.countryCode)) return false;
      if (filters.baseTypes.length && !filters.baseTypes.includes(base.type)) return false;
      if (filters.branches.length && !filters.branches.includes(base.branch)) return false;
      if (filters.status !== 'all' && base.status !== filters.status) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return base.name.toLowerCase().includes(q) || base.country.toLowerCase().includes(q);
      }
      return true;
    });
  }, [bases, filters]);
  
  const filteredEvents = useMemo(() => { /* similar filtering */ }, [events, filters]);
  
  return { filteredBases, filteredEvents };
}
```

## Key Interactions

1. **Click base marker** → Globe animates to base → Sidebar opens with BaseDetail
2. **Click event marker** → Globe animates to event → Sidebar opens with EventDetail
3. **Hover marker** → Tooltip shows name + type
4. **Apply filter** → Markers instantly update on globe
5. **Search** → Type ahead results → Click result → Globe flies to location
6. **Toggle event layer** → Show/hide red OSINT markers
7. **Reset camera** → Animate back to default world view
8. **Click country on globe** → Show CountryProfile in sidebar (count of bases, events)

## Responsive Considerations

- **Desktop (>1024px)**: Globe 70% + Sidebar 30%
- **Tablet (768-1024px)**: Globe full width, sidebar as overlay drawer
- **Mobile (<768px)**: Globe full screen, bottom sheet for details (stretch goal)

## Performance Requirements

- Globe should render at 60fps with 50+ markers
- Filters should update in <100ms
- Search autocomplete debounced to 300ms
- Use React.memo on marker components
- Lazy load sidebar content

## What NOT to Build in Phase 1

- No real API calls (use mock data imports)
- No authentication
- No WebSocket connections
- No data export functionality (just UI placeholder)
- No offline storage / service workers
- No satellite imagery loading

## Definition of Done

- [ ] Globe renders with 50+ color-coded military base markers
- [ ] OSINT events appear as pulsing red dots with animated arcs
- [ ] Clicking any marker opens sidebar with detail panel
- [ ] Filter panel filters bases by country, type, branch, status
- [ ] Search bar finds bases and events with autocomplete
- [ ] Stats bar shows correct filtered counts
- [ ] Event timeline chart renders with mock data
- [ ] Event feed shows scrollable list of events
- [ ] Sidebar tabs switch between Base / Event / Country views
- [ ] Globe camera animates smoothly on selection
- [ ] App is fully responsive on desktop and tablet
- [ ] Dark theme is consistent across all components
- [ ] No console errors or warnings
