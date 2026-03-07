import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { useFilterStore } from '@/store/useFilterStore'
import { useDataStore } from '@/store/useDataStore'
import { countries as staticCountries } from '@/data/countries'

export function CountryFilter() {
  const [search, setSearch] = useState('')
  const selected = useFilterStore((s) => s.countries)
  const toggleCountry = useFilterStore((s) => s.toggleCountry)

  const bases = useDataStore((s) => s.bases)
  const countriesList = useDataStore((s) => s.countriesList)
  const mode = useDataStore((s) => s.mode)

  // Build the list of countries that actually have data
  const availableCountries = useMemo(() => {
    // Collect country codes that appear in loaded bases
    const codesInData = new Set(bases.map((b) => b.countryCode).filter(Boolean))

    // Also include codes from the API countries endpoint (online)
    if (mode === 'online' && countriesList.length > 0) {
      for (const c of countriesList) {
        if (c.code) codesInData.add(c.code)
      }
    }

    // Map to rich country objects — prefer static metadata (flag, region) when available
    return Array.from(codesInData)
      .map((code) => {
        const staticMatch = staticCountries.find((sc) => sc.code === code)
        if (staticMatch) return staticMatch

        // For DB-only countries not in static list, build a basic entry
        const apiMatch = countriesList.find((c) => c.code === code)
        return {
          name: apiMatch?.name ?? code,
          code,
          lat: 0,
          lng: 0,
          region: '',
          flag: '',
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [bases, countriesList, mode])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return availableCountries
    return availableCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q),
    )
  }, [search, availableCountries])

  const selectedCountries = useMemo(
    () => availableCountries.filter((c) => selected.includes(c.code)),
    [selected, availableCountries],
  )

  return (
    <div className="flex flex-col gap-2">
      {/* Selected chips */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCountries.map((c) => (
            <span
              key={c.code}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-400 text-[11px] font-medium border border-cyan-400/30"
            >
              {c.flag && <span>{c.flag}</span>}
              {c.code}
              <button
                onClick={() => toggleCountry(c.code)}
                className="ml-0.5 hover:text-white transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search countries..."
          className="w-full pl-8 pr-3 py-1.5 rounded bg-navy-900 border border-navy-700 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 transition-colors"
        />
      </div>

      {/* Country list */}
      <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 scrollbar-thin">
        {filtered.map((c) => {
          const isSelected = selected.includes(c.code)
          return (
            <button
              key={c.code}
              onClick={() => toggleCountry(c.code)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left ${
                isSelected
                  ? 'bg-cyan-400/10 text-white'
                  : 'text-slate-300 hover:bg-navy-900/60 hover:text-white'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-cyan-400 border-cyan-400'
                    : 'border-slate-500'
                }`}
              >
                {isSelected && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    className="text-navy-900"
                  >
                    <path
                      d="M1.5 4L3.2 5.7L6.5 2.3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {c.flag && <span className="text-sm leading-none">{c.flag}</span>}
              <span className="truncate">{c.name}</span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-3">
            No countries match your search.
          </p>
        )}
      </div>
    </div>
  )
}
