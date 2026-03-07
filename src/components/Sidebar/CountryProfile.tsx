import { useMemo } from 'react'
import { Shield, AlertTriangle } from 'lucide-react'
import type { BaseType } from '@/types'
import { BASE_COLORS } from '@/utils/colors'
import { useDataStore } from '@/store/useDataStore'
import { countries } from '@/data/countries'

interface CountryProfileProps {
  countryCode: string
}

const TYPE_LABELS: Record<BaseType, string> = {
  airfield: 'Airfield',
  naval: 'Naval',
  barracks: 'Barracks',
  military: 'Military',
  range: 'Range',
  nuclear: 'Nuclear',
  bunker: 'Bunker',
}

export function CountryProfile({ countryCode }: CountryProfileProps) {
  const bases = useDataStore((s) => s.bases)
  const events = useDataStore((s) => s.events)

  const country = useMemo(
    () => countries.find((c) => c.code === countryCode),
    [countryCode],
  )

  const countryBases = useMemo(
    () => bases.filter((b) => b.countryCode === countryCode),
    [bases, countryCode],
  )

  const countryEvents = useMemo(
    () => events.filter((e) => e.countryCode === countryCode),
    [events, countryCode],
  )

  const baseTypes = useMemo(() => {
    const typeSet = new Set<BaseType>(countryBases.map((b) => b.type))
    return Array.from(typeSet).sort()
  }, [countryBases])

  const countryName = country?.name ?? countryCode
  const flag = country?.flag ?? ''

  return (
    <div className="space-y-4">
      {/* Country heading */}
      <div>
        <h2 className="text-lg font-bold text-white leading-tight">
          {flag && <span className="mr-2">{flag}</span>}
          {countryName}
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-lg bg-navy-900/60 border border-navy-700">
          <Shield size={16} className="text-cyan-400" />
          <span className="text-xl font-bold text-white">{countryBases.length}</span>
          <span className="text-[11px] text-slate-400">Bases</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-lg bg-navy-900/60 border border-navy-700">
          <AlertTriangle size={16} className="text-cyan-400" />
          <span className="text-xl font-bold text-white">{countryEvents.length}</span>
          <span className="text-[11px] text-slate-400">Events</span>
        </div>
      </div>

      {/* Base types present */}
      <div className="border-t border-navy-700 pt-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Base Types Present
        </h3>

        {baseTypes.length === 0 ? (
          <p className="text-xs text-slate-500">No bases in this country</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {baseTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-navy-900/60 text-slate-200 border border-navy-700"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: BASE_COLORS[type] }}
                />
                {TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* List of bases */}
      <div className="border-t border-navy-700 pt-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Bases
          {countryBases.length > 0 && (
            <span className="ml-1.5 text-cyan-400">({countryBases.length})</span>
          )}
        </h3>

        {countryBases.length === 0 ? (
          <p className="text-xs text-slate-500">No bases found</p>
        ) : (
          <div className="space-y-1.5">
            {countryBases.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded bg-navy-900/40 border border-navy-700/50"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: BASE_COLORS[b.type] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-200 truncate">{b.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {TYPE_LABELS[b.type]} &middot; {b.branch}
                  </p>
                </div>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    color:
                      b.status === 'active'
                        ? '#2A9D8F'
                        : b.status === 'limited'
                          ? '#F77F00'
                          : b.status === 'inactive'
                            ? '#E63946'
                            : '#9B5DE5',
                    backgroundColor:
                      b.status === 'active'
                        ? '#2A9D8F15'
                        : b.status === 'limited'
                          ? '#F77F0015'
                          : b.status === 'inactive'
                            ? '#E6394615'
                            : '#9B5DE515',
                  }}
                >
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
