import type { MilitaryBase, OSINTEvent } from '@/types'
import { BASE_COLORS } from '@/utils/colors'
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

export function eventTooltipHtml(event: OSINTEvent): string {
  const color = SEVERITY_COLORS[event.severity] ?? '#94A3B8'
  return `
    <div style="background:#0F172A;border:1px solid #E63946;border-radius:8px;padding:10px 14px;min-width:200px;font-family:system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;animation:pulse 2s infinite;"></span>
        <span style="color:#fff;font-size:13px;font-weight:600;">${event.title}</span>
      </div>
      <div style="color:#94A3B8;font-size:11px;margin-bottom:3px;">${event.country}</div>
      <div style="display:flex;gap:8px;font-size:10px;">
        <span style="color:${color};text-transform:uppercase;font-weight:600;">${event.severity}</span>
        <span style="color:#64748B;">|</span>
        <span style="color:#64748B;text-transform:uppercase;">${event.category.replace('_', ' ')}</span>
      </div>
    </div>
  `
}
