'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { BarChart2, Home, ShieldCheck, RefreshCw, UserCheck, Clock, CalendarOff } from 'lucide-react'

const STAGE_COLORS: Record<string, string> = {
  new_lead:'#3B82F6', contacted:'#60A5FA', interested:'#22D3EE',
  property_visit:'#F59E0B', negotiation:'#A855F7', closed:'#22C55E', lost:'#EF4444',
}

const STAGE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  new_lead:       { label: 'New Lead',       bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  contacted:      { label: 'Contacted',      bg: 'rgba(96,165,250,0.15)',  color: '#93C5FD' },
  interested:     { label: 'Interested',     bg: 'rgba(34,211,238,0.15)',  color: '#67E8F9' },
  property_visit: { label: 'Property Visit', bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D' },
  negotiation:    { label: 'Negotiation',    bg: 'rgba(168,85,247,0.15)',  color: '#D8B4FE' },
  closed:         { label: 'Closed',         bg: 'rgba(34,197,94,0.15)',   color: '#86EFAC' },
  lost:           { label: 'Lost',           bg: 'rgba(239,68,68,0.15)',   color: '#FCA5A5' },
}

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`
}

function initials(name: string) {
  return name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U'
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3B82F6, #1D4ED8)',
  'linear-gradient(135deg, #22C55E, #15803D)',
  'linear-gradient(135deg, #22D3EE, #0E7490)',
  'linear-gradient(135deg, #F59E0B, #B45309)',
  'linear-gradient(135deg, #A855F7, #6B21A8)',
  'linear-gradient(135deg, #EF4444, #B91C1C)',
]

// Animates a number counting up from 0 to its target value on mount / when the value changes.
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(0)

  useEffect(() => {
    fromRef.current = value
    startRef.current = null
    let raf: number
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(fromRef.current + (target - fromRef.current) * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return value
}

function GlassCard({ children, className = '', onClick, hoverable = false }: any) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[20px] transition-all duration-200 ${hoverable ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(59,130,246,0.12)',
      }}
      onMouseEnter={hoverable ? (e: any) => {
        e.currentTarget.style.border = '1px solid rgba(59,130,246,0.35)'
        e.currentTarget.style.boxShadow = '0 0 24px rgba(59,130,246,0.15)'
      } : undefined}
      onMouseLeave={hoverable ? (e: any) => {
        e.currentTarget.style.border = '1px solid rgba(59,130,246,0.12)'
        e.currentTarget.style.boxShadow = 'none'
      } : undefined}
    >
      {children}
    </div>
  )
}

function KpiCard({ value, label }: { value: number | string; label: string }) {
  const isNumeric = typeof value === 'number'
  const numeric = isNumeric ? value : parseInt(String(value)) || 0
  const animated = useCountUp(isNumeric ? value as number : numeric)
  const suffix = typeof value === 'string' ? value.replace(/[0-9]/g, '') : ''
  return (
    <GlassCard className="p-3 text-center">
      <div className="text-[19px] font-extrabold text-white">
        {isNumeric ? animated : `${animated}${suffix}`}
      </div>
      <div className="text-[9px] text-white/40 leading-tight mt-0.5 uppercase tracking-wide">{label}</div>
    </GlassCard>
  )
}

// Small standalone component so useCountUp is always called at the same
// hook position for ITS OWN render tree — safe to mount/unmount conditionally
// from the parent, unlike calling the hook directly inside conditional JSX.
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const animated = useCountUp(value)
  return <span className={className}>{animated}</span>
}

interface Props {
  profile: any
  stats: { totalLeads: number; newLeads: number; closedDeals: number; conversionRate: number }
  pipelineData: { stage: string; label: string; count: number }[]
  recentLeads: any[]
  isAdmin: boolean
  canSeeHR: boolean
  canSeeCRM: boolean
  hrStats: { employeeCount: number; presentToday: number; pendingLeave: number }
  onRefresh?: () => void
}

export function DashboardClient({ profile, stats, pipelineData, recentLeads, isAdmin, canSeeHR, canSeeCRM, hrStats, onRefresh }: Props) {
  const router    = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const total     = pipelineData.reduce((s, p) => s + p.count, 0)
  const chartData = pipelineData.filter(p => p.count > 0)
  const animatedTotal = useCountUp(total)

  async function handleRefresh() {
    setRefreshing(true)
    await onRefresh?.()
    setRefreshing(false)
  }

  const RefreshButton = (
    <button onClick={handleRefresh} disabled={refreshing}
      className="p-2 rounded-xl text-white/40 hover:text-[#60A5FA] transition-colors"
      style={{ border: '1px solid rgba(59,130,246,0.15)' }}>
      <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/>
    </button>
  )

  const Greeting = (name: string) => (
    <div>
      <h2 className="font-bold text-white text-lg leading-tight">
        Hello, {name}! <span className="inline-block">👋</span>
      </h2>
      <p className="text-xs text-white/40">Here's what's happening today.</p>
    </div>
  )

  // Staff-only view: no CRM, no HR management access — just a welcome + quick links
  if (!canSeeCRM && !canSeeHR) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-4 flex-shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
          {Greeting(profile?.full_name?.split(' ')[0] ?? 'there')}
          {RefreshButton}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <GlassCard hoverable onClick={() => router.push('/attendance')} className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.15)' }}>
              <Clock size={20} className="text-[#4ADE80]"/>
            </div>
            <div>
              <div className="text-sm font-bold text-white">My Attendance</div>
              <div className="text-xs text-white/40">Check in / check out</div>
            </div>
          </GlassCard>
          <GlassCard hoverable onClick={() => router.push('/hr/leave')} className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <CalendarOff size={20} className="text-[#FCD34D]"/>
            </div>
            <div>
              <div className="text-sm font-bold text-white">Leave Requests</div>
              <div className="text-xs text-white/40">Request time off</div>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* KPI Header — CRM only */}
      {canSeeCRM ? (
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
          <div className="flex items-start justify-between mb-3">
            {Greeting(profile?.full_name?.split(' ')[0] ?? 'Admin')}
            {RefreshButton}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <KpiCard value={stats.totalLeads} label="Total Leads" />
            <KpiCard value={stats.newLeads} label="New Leads" />
            <KpiCard value={stats.closedDeals} label="Closed" />
            <KpiCard value={`${stats.conversionRate}%`} label="Conv. Rate" />
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 flex-shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
          {Greeting(profile?.full_name?.split(' ')[0] ?? 'there')}
          {RefreshButton}
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">

        {/* Quick Nav — CRM only */}
        {canSeeCRM && (
          <div className="grid grid-cols-2 gap-3">
            <GlassCard hoverable onClick={() => router.push('/reports')} className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.15)' }}>
                <BarChart2 size={18} className="text-[#60A5FA]"/>
              </div>
              <div>
                <div className="text-xs font-bold text-white">Reports</div>
                <div className="text-[10px] text-white/40">Analytics</div>
              </div>
            </GlassCard>
            <GlassCard hoverable onClick={() => router.push('/properties')} className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.15)' }}>
                <Home size={18} className="text-[#4ADE80]"/>
              </div>
              <div>
                <div className="text-xs font-bold text-white">Properties</div>
                <div className="text-[10px] text-white/40">Listings</div>
              </div>
            </GlassCard>
            {isAdmin && (
              <GlassCard hoverable onClick={() => router.push('/admin')} className="col-span-2 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <ShieldCheck size={18} className="text-[#FCA5A5]"/>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Admin Panel</div>
                  <div className="text-[10px] text-white/40">Team overview & notifications</div>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* HR Summary */}
        {canSeeHR && (
          <div>
            <div className="text-sm font-bold text-white mb-2">HR Overview</div>
            <div className="grid grid-cols-3 gap-2">
              <GlassCard hoverable onClick={() => router.push('/hr/employees')} className="p-3 flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5"
                  style={{ background: 'rgba(59,130,246,0.15)' }}>
                  <UserCheck size={17} className="text-[#60A5FA]"/>
                </div>
                <div className="text-lg font-extrabold text-white"><AnimatedNumber value={hrStats.employeeCount} /></div>
                <div className="text-[10px] text-white/40 leading-tight">Employees</div>
              </GlassCard>
              <GlassCard hoverable onClick={() => router.push('/hr/attendance')} className="p-3 flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5"
                  style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <Clock size={17} className="text-[#4ADE80]"/>
                </div>
                <div className="text-lg font-extrabold text-white"><AnimatedNumber value={hrStats.presentToday} /></div>
                <div className="text-[10px] text-white/40 leading-tight">Present Today</div>
              </GlassCard>
              <GlassCard hoverable onClick={() => router.push('/hr/leave')} className="p-3 flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5"
                  style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <CalendarOff size={17} className="text-[#FCD34D]"/>
                </div>
                <div className="text-lg font-extrabold text-white"><AnimatedNumber value={hrStats.pendingLeave} /></div>
                <div className="text-[10px] text-white/40 leading-tight">Pending Leave</div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Pipeline Donut — CRM only */}
        {canSeeCRM && (
          <div>
            <div className="text-sm font-bold text-white mb-2">Leads by Pipeline Stage</div>
            <GlassCard className="p-4">
              {total > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-[110px] h-[110px] flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {chartData.map(e => (
                            <filter key={e.stage} id={`glow-${e.stage}`}>
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          ))}
                        </defs>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                          dataKey="count" paddingAngle={3} stroke="none">
                          {chartData.map(e => (
                            <Cell key={e.stage} fill={STAGE_COLORS[e.stage] ?? '#666'} style={{ filter: `url(#glow-${e.stage})` }} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-xl font-extrabold text-white">{animatedTotal}</div>
                      <div className="text-[9px] text-white/40 text-center leading-tight">Total<br/>Leads</div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {pipelineData.map(p => (
                      <div key={p.stage} className="flex items-center gap-2 text-[11px]">
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: STAGE_COLORS[p.stage], boxShadow: `0 0 6px ${STAGE_COLORS[p.stage]}` }}/>
                        <span className="flex-1 truncate text-white/60">{p.label}</span>
                        <span className="font-semibold text-white">{p.count}</span>
                        <span className="text-white/30 w-8 text-right">
                          {total ? Math.round(p.count/total*100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm text-white/40 mb-3">No leads yet.</p>
                  <button onClick={() => router.push('/leads')}
                    className="text-xs font-bold text-white px-4 py-2 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}>
                    + Add first lead
                  </button>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* Recent Leads — CRM only */}
        {canSeeCRM && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-white">Recent Leads</div>
              <button onClick={() => router.push('/leads')} className="text-xs text-[#60A5FA] font-semibold hover:text-[#93C5FD] transition-colors">
                View All →
              </button>
            </div>
            <GlassCard className="overflow-hidden">
              {recentLeads.length > 0 ? recentLeads.map((lead: any, i: number) => {
                const badge = STAGE_CONFIG[lead.stage]
                const gi    = i % AVATAR_GRADIENTS.length
                return (
                  <button key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 last:border-0 hover:bg-white/[0.03] active:bg-white/[0.06] text-left transition-colors"
                    style={{ borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                      style={{ background: AVATAR_GRADIENTS[gi] }}>
                      {initials(lead.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{lead.full_name}</div>
                      <div className="text-xs text-white/40 truncate">{lead.location ?? 'Addis Ababa'}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: badge?.bg, color: badge?.color }}>
                      {badge?.label}
                    </span>
                    <span className="text-[10px] text-white/30 flex-shrink-0">{timeAgo(lead.created_at)}</span>
                  </button>
                )
              }) : (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm text-white/40">No leads yet.</p>
                  <button onClick={() => router.push('/leads')}
                    className="mt-3 text-xs font-bold text-[#60A5FA] hover:text-[#93C5FD] transition-colors">+ Add your first lead</button>
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  )
}