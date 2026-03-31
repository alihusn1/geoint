import type { MilitaryBase, OSINTEvent, StrategicFeatureData } from '@/types'
import { BASE_COLORS, STRATEGIC_LAYER_COLORS } from '@/utils/colors'
import { SEVERITY_COLORS } from '@/utils/colors'

export function baseTooltipHtml(base: MilitaryBase): string {
  const color = BASE_COLORS[base.type] ?? '#94A3B8'
  return `
    <div style="background:#0F172A;border:1px solid #1E293B;border-radius:8px;padding:10px 14px;min-width:180px;font-family:system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
        <span style="color:#fff;font-size:13px;font-weight:600;">${base.name}</span>
      </div>
      <div style="color:#94A3B8;font-size:11px;margin-bottom:3px;">${base.country}</div>
      <div style="display:flex;gap:8px;font-size:10px;color:#64748B;">
        <span style="text-transform:uppercase;">${base.type}</span>
        <span>|</span>
        <span>${base.branch}</span>
      </div>
      <div style="margin-top:6px;font-size:10px;">
        <span style="color:${base.status === 'active' ? '#2A9D8F' : base.status === 'limited' ? '#F77F00' : '#E63946'};text-transform:uppercase;font-weight:600;">${base.status}</span>
      </div>
    </div>
  `
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str
}

export function eventTooltipHtml(event: OSINTEvent): string {
  const color = SEVERITY_COLORS[event.severity] ?? '#94A3B8'
  const meta = event.metadata

  // Summary line: prefer ai_summary, fall back to description
  const summary = meta?.ai_summary ?? event.description
  const summaryHtml = summary
    ? `<div style="color:#CBD5E1;font-size:11px;line-height:1.4;margin-top:6px;max-width:320px;">${escapeHtml(truncate(summary, 180))}</div>`
    : ''

  // Actors
  let actorsHtml = ''
  if (meta?.actors && meta.actors.length > 0) {
    const names = meta.actors
      .map((a) => (typeof a === 'string' ? a : a.name))
      .slice(0, 3)
    actorsHtml = `<div style="margin-top:4px;font-size:10px;color:#94A3B8;">Actors: <span style="color:#E2E8F0;">${escapeHtml(names.join(', '))}</span></div>`
  } else if (meta?.actor1_name) {
    const parts = [meta.actor1_name, meta.actor2_name].filter(Boolean)
    actorsHtml = `<div style="margin-top:4px;font-size:10px;color:#94A3B8;">Actors: <span style="color:#E2E8F0;">${escapeHtml(parts.join(' → '))}</span></div>`
  }

  // Tags
  let tagsHtml = ''
  if (meta?.tags && meta.tags.length > 0) {
    const tagSpans = meta.tags.slice(0, 4).map(
      (t) => `<span style="display:inline-block;padding:1px 5px;border-radius:3px;background:#1E293B;color:#94A3B8;font-size:9px;margin-right:3px;">${escapeHtml(t)}</span>`
    ).join('')
    tagsHtml = `<div style="margin-top:5px;">${tagSpans}</div>`
  }

  // Goldstein / Tone for GDELT
  let metricsHtml = ''
  if (meta?.goldstein_scale != null) {
    const gs = meta.goldstein_scale
    const gsColor = gs > 0 ? '#2A9D8F' : gs < 0 ? '#E63946' : '#94A3B8'
    metricsHtml += `<span style="color:${gsColor};">GS: ${gs.toFixed(1)}</span>`
  }
  if (meta?.avg_tone != null) {
    const sep = metricsHtml ? '<span style="color:#475569;"> | </span>' : ''
    const tone = meta.avg_tone
    const tColor = tone > 0 ? '#2A9D8F' : tone < 0 ? '#E63946' : '#94A3B8'
    metricsHtml += `${sep}<span style="color:${tColor};">Tone: ${tone.toFixed(1)}</span>`
  }
  if (meta?.trending_score != null) {
    const sep = metricsHtml ? '<span style="color:#475569;"> | </span>' : ''
    metricsHtml += `${sep}<span style="color:#A855F7;">Trend: ${meta.trending_score}/10</span>`
  }
  if (metricsHtml) {
    metricsHtml = `<div style="margin-top:4px;font-size:10px;">${metricsHtml}</div>`
  }

  // AI rationale (one-liner)
  const rationaleHtml = meta?.ai_rationale
    ? `<div style="margin-top:4px;font-size:10px;color:#64748B;font-style:italic;max-width:320px;">${escapeHtml(truncate(meta.ai_rationale, 140))}</div>`
    : ''

  // Relevance + PAK impact badges
  let badgesHtml = ''
  const badges: string[] = []
  if (meta?.ai_relevance_score != null) badges.push(`<span style="color:#22D3EE;">Rel: ${meta.ai_relevance_score}</span>`)
  if (meta?.pakistan_impact_score != null || meta?.ai_pakistan_impact_score != null) {
    const score = meta.pakistan_impact_score ?? meta.ai_pakistan_impact_score
    badges.push(`<span style="color:#F59E0B;">PAK: ${score}/10</span>`)
  }
  if (badges.length) {
    badgesHtml = `<div style="margin-top:4px;font-size:10px;">${badges.join('<span style="color:#475569;"> | </span>')}</div>`
  }

  // Source → Target flow
  let flowHtml = ''
  const srcLabel = event.sourceLocation ?? event.sourceCountryCode
  const tgtLabel = event.targetLocation ?? event.targetCountryCode
  if (srcLabel || tgtLabel) {
    const parts = [srcLabel, event.country, tgtLabel].filter(Boolean)
    flowHtml = `<div style="margin-top:4px;font-size:10px;color:#64748B;">${escapeHtml(parts.join(' → '))}</div>`
  }

  return `
    <div style="background:#0F172A;border:1px solid ${color}40;border-radius:8px;padding:10px 14px;min-width:220px;max-width:360px;font-family:system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
        <span style="color:#fff;font-size:13px;font-weight:600;line-height:1.3;">${escapeHtml(truncate(event.title, 80))}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:10px;margin-bottom:2px;">
        <span style="color:${color};text-transform:uppercase;font-weight:600;">${event.severity}</span>
        <span style="color:#475569;">|</span>
        <span style="color:#64748B;text-transform:uppercase;">${event.category.replace(/_/g, ' ')}</span>
        <span style="color:#475569;">|</span>
        <span style="color:#94A3B8;">${event.country}</span>
      </div>
      ${flowHtml}
      ${summaryHtml}
      ${rationaleHtml}
      ${actorsHtml}
      ${badgesHtml}
      ${metricsHtml}
      ${tagsHtml}
    </div>
  `
}

export function strategicTooltipHtml(data: StrategicFeatureData): string {
  const color = STRATEGIC_LAYER_COLORS[data.layerId] ?? '#94A3B8'
  const desc = data.description ? escapeHtml(truncate(data.description, 120)) : ''
  const descHtml = desc
    ? `<div style="color:#CBD5E1;font-size:11px;line-height:1.4;margin-top:6px;max-width:280px;">${desc}</div>`
    : ''
  return `
    <div style="background:#0F172A;border:1px solid ${color}40;border-radius:8px;padding:10px 14px;min-width:180px;max-width:300px;font-family:system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
        <span style="color:#fff;font-size:13px;font-weight:600;line-height:1.3;">${escapeHtml(truncate(data.name, 60))}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:10px;margin-bottom:2px;">
        <span style="padding:1px 6px;border-radius:3px;background:${color}25;color:${color};font-weight:600;text-transform:uppercase;">${escapeHtml(data.category.replace(/_/g, ' '))}</span>
        ${data.country ? `<span style="color:#94A3B8;">${escapeHtml(data.country)}</span>` : ''}
      </div>
      ${data.subcategory ? `<div style="font-size:10px;color:#64748B;margin-top:2px;">${escapeHtml(data.subcategory)}</div>` : ''}
      ${data.status ? `<div style="margin-top:4px;font-size:10px;"><span style="color:${data.status.toLowerCase() === 'active' ? '#2A9D8F' : data.status.toLowerCase() === 'inactive' ? '#E63946' : '#F77F00'};text-transform:uppercase;font-weight:600;">${escapeHtml(data.status)}</span></div>` : ''}
      ${descHtml}
    </div>
  `
}
