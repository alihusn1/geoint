# GeoINT Globe — Phase 3: Frontend-Backend Integration

## Overview

Connect the Phase 1 React frontend to the Phase 2 FastAPI backend, replacing all mock data with live API calls. Add real-time updates, error handling, loading states, and production-ready features.

## Prerequisites

- Phase 1 frontend running on `localhost:5173`
- Phase 2 backend running on `localhost:8000`
- Backend has scraped data (run `python scripts/init_db.py` first)

## Integration Architecture

```
┌─────────────────────────────────┐
│        React Frontend           │
│  (Vite dev server :5173)        │
│                                 │
│  Zustand stores ←→ api.ts ──────┼──── HTTP ────┐
│                                 │               │
│  Globe.gl ← useFilteredData()   │               │
│  Sidebar ← useDataStore()       │               │
│  Stats   ← useDataStore()       │               │
└─────────────────────────────────┘               │
                                                  ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend (:8000)                 │
│                                                     │
│  /api/bases    /api/events    /api/stats             │
│  /api/search   /api/health                           │
│       │             │             │                   │
│       ▼             ▼             ▼                   │
│  ┌──────────────────────────────────────┐            │
│  │       PostgreSQL + PostGIS          │            │
│  └──────────────────────────────────────┘            │
│                                                     │
│  APScheduler → scrapers → DB (background)            │
└─────────────────────────────────────────────────────┘
```

## Step-by-Step Integration Tasks

---

### Task 1: Configure API Client

**File: `src/services/api.ts`**

Replace the stub with a real Axios instance:

```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    console.error(`API Error [${error.config?.url}]:`, message);
    throw { message, status: error.response?.status };
  }
);

export default api;
```

**Add to `.env`:**
```
VITE_API_URL=http://localhost:8000
```

---

### Task 2: Create API Service Functions

**File: `src/services/baseService.ts`**

```typescript
import api from './api';

export const baseService = {
  // Fetch bases with filters
  getBases: (params = {}) => api.get('/bases', { params }),

  // Get single base detail
  getBase: (id) => api.get(`/bases/${id}`),

  // Get nearby events for a base
  getNearbyEvents: (id, radiusKm = 200) =>
    api.get(`/bases/${id}/nearby-events`, { params: { radius_km: radiusKm } }),

  // Get country list with counts
  getCountries: () => api.get('/bases/countries'),

  // Export as GeoJSON
  exportGeoJSON: (params = {}) =>
    api.get('/bases/export', { params: { ...params, format: 'geojson' } }),
};
```

**File: `src/services/eventService.ts`**

```typescript
import api from './api';

export const eventService = {
  getEvents: (params = {}) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  getTimeline: (days = 30, groupBy = 'day') =>
    api.get('/events/timeline', { params: { days, group_by: groupBy } }),
  getLatest: (limit = 20) =>
    api.get('/events/latest', { params: { limit } }),
};
```

**File: `src/services/statsService.ts`**

```typescript
import api from './api';

export const statsService = {
  getStats: () => api.get('/stats'),
  search: (q, limit = 10) => api.get('/search', { params: { q, limit } }),
  getHealth: () => api.get('/health'),
};
```

---

### Task 3: Refactor useDataStore to Use API

**File: `src/store/useDataStore.ts`**

Replace mock data imports with API calls:

```typescript
import { create } from 'zustand';
import { baseService } from '../services/baseService';
import { eventService } from '../services/eventService';
import { statsService } from '../services/statsService';

const useDataStore = create((set, get) => ({
  // Data
  bases: [],
  events: [],
  stats: null,
  countries: [],

  // State
  loading: false,
  error: null,
  lastUpdated: null,
  mode: 'online',        // 'online' | 'offline'

  // Fetch bases with current filters
  fetchBases: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = {};
      if (filters.countries?.length) params.country = filters.countries.join(',');
      if (filters.baseTypes?.length) params.type = filters.baseTypes.join(',');
      if (filters.branches?.length) params.branch = filters.branches.join(',');
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.searchQuery) params.search = filters.searchQuery;
      params.limit = 5000;

      const data = await baseService.getBases(params);
      set({
        bases: data.bases,
        loading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      // If API fails, keep existing data (graceful degradation)
    }
  },

  // Fetch events
  fetchEvents: async (filters = {}) => {
    try {
      const params = {};
      if (filters.countries?.length) params.country = filters.countries.join(',');
      if (filters.dateRange?.from) params.from_date = filters.dateRange.from;
      if (filters.dateRange?.to) params.to_date = filters.dateRange.to;
      if (filters.searchQuery) params.search = filters.searchQuery;
      params.limit = 500;

      const data = await eventService.getEvents(params);
      set({ events: data.events });
    } catch (error) {
      console.error('Failed to fetch events:', error.message);
    }
  },

  // Fetch stats
  fetchStats: async () => {
    try {
      const stats = await statsService.getStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error.message);
    }
  },

  // Fetch countries list
  fetchCountries: async () => {
    try {
      const countries = await baseService.getCountries();
      set({ countries });
    } catch (error) {
      console.error('Failed to fetch countries:', error.message);
    }
  },

  // Check backend health and set mode
  checkHealth: async () => {
    try {
      const health = await statsService.getHealth();
      set({ mode: health.status === 'ok' ? 'online' : 'offline' });
      return true;
    } catch {
      set({ mode: 'offline' });
      return false;
    }
  },

  setMode: (mode) => set({ mode }),
}));

export default useDataStore;
```

---

### Task 4: App Initialization Flow

**File: `src/App.tsx` — add initialization logic**

```typescript
import { useEffect } from 'react';
import useDataStore from './store/useDataStore';
import useFilterStore from './store/useFilterStore';

// On mount: check health → fetch initial data
function App() {
  const { checkHealth, fetchBases, fetchEvents, fetchStats, fetchCountries, mode } = useDataStore();
  const filters = useFilterStore();

  // Initial load
  useEffect(() => {
    const init = async () => {
      const isOnline = await checkHealth();
      if (isOnline) {
        await Promise.all([
          fetchBases(),
          fetchEvents(),
          fetchStats(),
          fetchCountries(),
        ]);
      }
      // If offline, Phase 1 mock data remains as fallback (see Task 5)
    };
    init();
  }, []);

  // Re-fetch when filters change (debounced)
  useEffect(() => {
    if (mode !== 'online') return;
    const timeout = setTimeout(() => {
      fetchBases(filters);
      fetchEvents(filters);
    }, 300);
    return () => clearTimeout(timeout);
  }, [
    filters.countries,
    filters.baseTypes,
    filters.branches,
    filters.status,
    filters.dateRange,
    filters.searchQuery,
    mode,
  ]);

  // Refresh events every 5 minutes when online
  useEffect(() => {
    if (mode !== 'online') return;
    const interval = setInterval(() => {
      fetchEvents(filters);
      fetchStats();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mode]);

  return (/* ... existing JSX ... */);
}
```

---

### Task 5: Offline Fallback with Mock Data

Keep mock data as fallback when backend is unreachable:

**File: `src/store/useDataStore.ts` — modify fetchBases:**

```typescript
import { mockBases } from '../data/mockBases';
import { mockEvents } from '../data/mockEvents';

fetchBases: async (filters = {}) => {
  set({ loading: true, error: null });
  try {
    // Try API first
    const data = await baseService.getBases(params);
    set({ bases: data.bases, loading: false });
  } catch (error) {
    console.warn('API unavailable, using mock data');
    set({
      bases: mockBases,    // Fallback to Phase 1 mock data
      events: mockEvents,
      mode: 'offline',
      loading: false,
      error: 'Backend unavailable — showing cached data',
    });
  }
},
```

---

### Task 6: Wire Up Search Component

**File: `src/components/Search/SearchBar.tsx`**

Replace local filtering with API search:

```typescript
import { useState, useCallback } from 'react';
import { statsService } from '../../services/statsService';
import useGlobeStore from '../../store/useGlobeStore';
import { debounce } from '../../utils/helpers';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const { setCameraPosition, setSelectedBase, setSelectedEvent, setSidebarOpen } = useGlobeStore();

  const search = useCallback(
    debounce(async (q) => {
      if (q.length < 2) { setResults(null); return; }
      try {
        const data = await statsService.search(q);
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults(null);
      }
    }, 300),
    []
  );

  const handleSelect = (item, type) => {
    setCameraPosition({ lat: item.lat, lng: item.lng, altitude: 0.5 });
    if (type === 'base') {
      setSelectedBase(item);
      setSidebarOpen(true);
    } else if (type === 'event') {
      setSelectedEvent(item);
      setSidebarOpen(true);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (/* ... render input + dropdown with results.bases, results.events, results.countries ... */);
}
```

---

### Task 7: Wire Up Sidebar with API Detail Calls

**File: `src/components/Sidebar/BaseDetail.tsx`**

Load full detail + nearby events from API:

```typescript
import { useEffect, useState } from 'react';
import { baseService } from '../../services/baseService';

export default function BaseDetail({ baseId }) {
  const [base, setBase] = useState(null);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!baseId) return;
    setLoading(true);
    
    Promise.all([
      baseService.getBase(baseId),
      baseService.getNearbyEvents(baseId, 200),
    ]).then(([baseData, events]) => {
      setBase(baseData);
      setNearbyEvents(events);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [baseId]);

  if (loading) return <LoadingSkeleton />;
  if (!base) return <div>Base not found</div>;

  return (/* ... render full base detail + nearby events list ... */);
}
```

---

### Task 8: Wire Up Event Timeline Chart

**File: `src/components/Dashboard/EventTimeline.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { eventService } from '../../services/eventService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function EventTimeline() {
  const [data, setData] = useState([]);

  useEffect(() => {
    eventService.getTimeline(30, 'day').then(setData).catch(console.error);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <XAxis dataKey="date" tick={{ fill: '#8B9EB0', fontSize: 11 }} />
        <YAxis tick={{ fill: '#8B9EB0', fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="count" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

---

### Task 9: Wire Up Event Feed with Auto-Refresh

**File: `src/components/Dashboard/EventFeed.tsx`**

```typescript
import { useEffect, useState, useRef } from 'react';
import { eventService } from '../../services/eventService';
import useDataStore from '../../store/useDataStore';

export default function EventFeed() {
  const [events, setEvents] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const prevIds = useRef(new Set());
  const mode = useDataStore((s) => s.mode);

  const loadEvents = async () => {
    try {
      const data = await eventService.getLatest(30);
      const newEvents = data.filter((e) => !prevIds.current.has(e.id));
      setNewCount(newEvents.length);
      setEvents(data);
      prevIds.current = new Set(data.map((e) => e.id));
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  useEffect(() => {
    loadEvents();
    if (mode !== 'online') return;
    const interval = setInterval(loadEvents, 60 * 1000);  // Refresh every minute
    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div>
      {newCount > 0 && (
        <div className="bg-red-900/30 text-red-400 px-3 py-1 text-xs rounded mb-2">
          {newCount} new event{newCount > 1 ? 's' : ''} since last check
        </div>
      )}
      {/* ... render event list ... */}
    </div>
  );
}
```

---

### Task 10: Data Export Integration

**File: `src/components/Dashboard/ExportButton.tsx`**

```typescript
import { baseService } from '../../services/baseService';
import useFilterStore from '../../store/useFilterStore';

export default function ExportButton() {
  const filters = useFilterStore();

  const handleExport = async (format) => {
    try {
      const params = {};
      if (filters.countries?.length) params.country = filters.countries.join(',');
      if (filters.baseTypes?.length) params.type = filters.baseTypes.join(',');
      params.format = format;

      const data = await baseService.exportGeoJSON(params);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geoint_bases_${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <button onClick={() => handleExport('geojson')} className="...">
      Export GeoJSON
    </button>
  );
}
```

---

### Task 11: StatusIndicator — Online/Offline Badge

**File: `src/components/Layout/StatusIndicator.tsx`**

```typescript
import useDataStore from '../../store/useDataStore';

export default function StatusIndicator() {
  const mode = useDataStore((s) => s.mode);
  const lastUpdated = useDataStore((s) => s.lastUpdated);
  const error = useDataStore((s) => s.error);

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${mode === 'online' ? 'bg-green-400 animate-pulse' : 'bg-orange-400'}`} />
      <span className="text-xs text-slate-400">
        {mode === 'online' ? 'Live' : 'Offline'}
      </span>
      {error && <span className="text-xs text-red-400 ml-2">{error}</span>}
    </div>
  );
}
```

---

### Task 12: Loading States & Skeletons

Add loading states across the app:

```typescript
// Reusable skeleton component
export function Skeleton({ className }) {
  return <div className={`animate-pulse bg-slate-700 rounded ${className}`} />;
}

// Globe loading overlay
export function GlobeLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-navy-900/80 z-10">
      <div className="text-cyan-400 text-lg flex items-center gap-3">
        <svg className="animate-spin h-6 w-6" /* spinner SVG */ />
        Loading intelligence data...
      </div>
    </div>
  );
}
```

**Apply loading states to:**
- Globe: show GlobeLoader while `useDataStore.loading` is true
- Sidebar: show skeleton cards while detail loads
- Stats bar: show skeleton numbers during initial load
- Event feed: show skeleton list items
- Search: show "Searching..." in dropdown

---

### Task 13: Error Boundaries

**File: `src/components/ErrorBoundary.tsx`**

```typescript
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-900/20 border border-red-800 rounded m-4">
          <h3 className="text-red-400 font-bold mb-2">Something went wrong</h3>
          <p className="text-slate-400 text-sm">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })} className="mt-3 text-cyan-400 text-sm">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrap: GlobeView, Sidebar, Dashboard in ErrorBoundary.

---

### Task 14: Vite Proxy for Development

**File: `vite.config.ts`**

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

With this proxy, update `api.ts` to use relative paths in development:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '';
```

---

### Task 15: Production Docker Compose

**File: `docker-compose.prod.yml` (root of monorepo)**

```yaml
version: "3.8"
services:
  frontend:
    build:
      context: ./geoint-globe
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build:
      context: ./geoint-backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file: ./geoint-backend/.env
    volumes:
      - backend-data:/app/data
    depends_on:
      - db

  db:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_USER: geoint
      POSTGRES_PASSWORD: ${DB_PASSWORD:-geoint_pass}
      POSTGRES_DB: geoint
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
  backend-data:
```

**Frontend Dockerfile (`geoint-globe/Dockerfile`):**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Frontend nginx.conf:**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Integration Checklist

### Data Flow Verification

- [ ] App loads → health check → mode set to online/offline
- [ ] Bases load from API on mount, markers appear on globe
- [ ] Events load from API, red dots appear on globe
- [ ] Stats bar shows accurate counts from /api/stats
- [ ] Clicking a base → API call for detail → sidebar renders
- [ ] Clicking a base → API call for nearby events → events listed
- [ ] Applying a filter → API re-fetch → globe updates immediately
- [ ] Search → API /search call → results dropdown → click navigates globe
- [ ] Event timeline chart loads from /api/events/timeline
- [ ] Event feed auto-refreshes every 60 seconds
- [ ] Export button downloads GeoJSON from API

### Error Handling Verification

- [ ] Backend down → app falls back to mock data, shows "Offline" badge
- [ ] API timeout → loading state clears, error shown, old data preserved
- [ ] Empty search → graceful "No results" message
- [ ] Invalid filters → API returns 422, frontend shows user-friendly error
- [ ] Network reconnect → mode switches back to "Online" on next health check

### Performance Verification

- [ ] Initial load completes in <3 seconds with 3000+ bases
- [ ] Filter changes reflect on globe in <500ms
- [ ] Search autocomplete responds in <300ms
- [ ] Globe maintains 60fps after data load
- [ ] No memory leaks from polling intervals (cleanup on unmount)

### Production Readiness

- [ ] Docker Compose starts all 3 services (frontend, backend, db)
- [ ] Frontend served via nginx with API proxy
- [ ] Backend API accessible at /api/ through nginx
- [ ] Environment variables properly configured
- [ ] CORS works in production mode
- [ ] No console errors in production build

## Definition of Done

- [ ] All mock data replaced with live API calls
- [ ] Offline fallback works when backend is unavailable
- [ ] Loading states show on all async operations
- [ ] Error boundaries catch and display component errors gracefully
- [ ] Auto-refresh keeps event data current every 60s
- [ ] Search is fully integrated with API
- [ ] Export functionality works end-to-end
- [ ] Online/Offline status indicator is accurate
- [ ] Production Docker Compose deploys the full stack
- [ ] All items in the integration checklist pass
