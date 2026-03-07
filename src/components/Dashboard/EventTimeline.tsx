import { useMemo, useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useFilteredData } from '@/hooks/useFilteredData'
import { useDataStore } from '@/store/useDataStore'
import * as eventService from '@/services/eventService'

interface TimelinePoint {
  date: string
  count: number
}

export function EventTimeline() {
  const { filteredEvents } = useFilteredData()
  const mode = useDataStore((s) => s.mode)
  const [apiData, setApiData] = useState<TimelinePoint[] | null>(null)

  // Fetch timeline from API when online
  useEffect(() => {
    if (mode !== 'online') {
      setApiData(null)
      return
    }
    let cancelled = false
    eventService
      .getTimeline(30, 'day')
      .then((res: any[]) => {
        if (cancelled) return
        setApiData(
          res.map((entry) => ({
            date: (entry.date as string).slice(5), // MM-DD
            count: entry.count,
          })),
        )
      })
      .catch(() => {
        if (!cancelled) setApiData(null)
      })
    return () => { cancelled = true }
  }, [mode])

  // Client-side aggregation for offline
  const offlineData = useMemo(() => {
    const grouped: Record<string, number> = {}
    filteredEvents.forEach((e) => {
      const day = e.timestamp.slice(0, 10)
      grouped[day] = (grouped[day] ?? 0) + 1
    })
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        count,
      }))
  }, [filteredEvents])

  const chartData = apiData ?? offlineData
  if (chartData.length === 0) return null

  return (
    <div className="bg-surface-300 rounded border border-navy-700 p-3">
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">
        Event Timeline
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
            width={20}
          />
          <Tooltip
            contentStyle={{
              background: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: 6,
              fontSize: 12,
              color: '#e2e8f0',
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#00B4D8"
            fill="url(#eventGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
