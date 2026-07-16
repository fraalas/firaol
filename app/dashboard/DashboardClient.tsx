'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { BarChart2, Home, ShieldCheck, RefreshCw, UserCheck, Clock, CalendarOff } from 'lucide-react'

const STAGE_COLORS: Record<string, string> = {
  new_lead:'#1F4FA8', contacted:'#60A5FA', interested:'#14B8A6',
  property_visit:'#F59E0B', negotiation:'#A855F7', closed:'#22C55E', lost:'#EF4444',
}

const STAGE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  new_lead:       { label: 'New Lead',       bg: '#EFF6FF', color: '#1D4ED8' },
  contacted:      { label: 'Contacted',      bg: '#F0FDF4', color: '#166534' },
  interested:     { label: 'Interested',     bg: '#F0FDFA', color: '#0F766E' },
  property_visit: { label: 'Property Visit', bg: '#FFFBEB', color: '#92400E' },
  negotiation:    { label: 'Negotiation',    bg: '#FAF5FF', color: '#6B21A8' },
  closed:         { label: 'Closed',         bg: '#ECFDF5', color: '#065F46' },
  lost:           { label: 'Lost',           bg: '#FEF2F2', color: '#991B1B' },
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

const AVATAR_BG = ['#EFF6FF','#F0FDF4','#F0FDFA','#FFFBEB','#FAF5FF','#FEF2F2']
const AVATAR_TC = ['#1D4ED8','#166534','#0F766E','#92400E','#6B21A8','#991B1B']

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

  async function handleRefresh() {
    setRefreshing(true)
    await onRefresh?.()
    setRefreshing(false)
  }

  // Staff-only view: no CRM, no HR management access — just a welcome + quick links
  if (!canSeeCRM && !canSeeHR) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="bg-white border-b border-[#E2E8F4] px-4 py-4 flex-shrink-0 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#0D1B3E] text-lg leading-tight">
              Hello, {profile?.full_name?.split(' ')[0] ?? 'there'}! 👋
            </h2>
            <p className="text-xs text-[#9AAAC8]">Here's what's happening today.</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2 rounded-xl border border-[#E2E8F4] text-[#9AAAC8] hover:text-[#1A3A6B] hover:border-[#1A3A6B] transition-colors">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <button onClick={() => router.push('/attendance')}
            className="w-full bg-white rounded-2xl border border-[#E2E8F4] p-4 flex items-center gap-3 hover:border-[#1A3A6B]/30 active:scale-95 transition-all text-left">
            <div className="w-11 h-11 bg-[#F0FDF4] rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-[#166534]"/>
            </div>
            <div>
              <div className="text-sm font-bold text-[#0D1B3E]">My Attendance</div>
              <div className="text-xs text-[#9AAAC8]">Check in / check out</div>
            </div>
          </button>
          <button onClick={() => router.push('/hr/leave')}
            className="w-full bg-white rounded-2xl border border-[#E2E8F4] p-4 flex items-center gap-3 hover:border-[#1A3A6B]/30 active:scale-95 transition-all text-left">
            <div className="w-11 h-11 bg-[#FFFBEB] rounded-xl flex items-center justify-center flex-shrink-0">
              <CalendarOff size={20} className="text-[#92400E]"/>
            </div>
            <div>
              <div className="text-sm font-bold text-[#0D1B3E]">Leave Requests</div>
              <div className="text-xs text-[#9AAAC8]">Request time off</div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* KPI Header — CRM only */}
      {canSeeCRM ? (
        <div className="bg-white border-b border-[#E2E8F4] px-4 py-3 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-bold text-[#0D1B3E] text-lg leading-tight">
                Hello, {profile?.full_name?.split(' ')[0] ?? 'Admin'}! 👋
              </h2>
              <p className="text-xs text-[#9AAAC8]">Here's what's happening today.</p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="p-2 rounded-xl border border-[#E2E8F4] text-[#9AAAC8] hover:text-[#1A3A6B] hover:border-[#1A3A6B] transition-colors">
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { val: stats.totalLeads,           label: 'Total Leads' },
              { val: stats.newLeads,             label: 'New Leads'   },
              { val: stats.closedDeals,          label: 'Closed'      },
              { val: `${stats.conversionRate}%`, label: 'Conv. Rate'  },
            ].map((k, i) => (
              <div key={i} className="bg-[#F5F7FB] rounded-xl p-2 text-center border border-[#E2E8F4]">
                <div className="text-[17px] font-extrabold text-[#0D1B3E]">{k.val}</div>
                <div className="text-[9px] text-[#9AAAC8] leading-tight mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border-b border-[#E2E8F4] px-4 py-4 flex-shrink-0 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#0D1B3E] text-lg leading-tight">
              Hello, {profile?.full_name?.split(' ')[0] ?? 'there'}! 👋
            </h2>
            <p className="text-xs text-[#9AAAC8]">Here's what's happening today.</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2 rounded-xl border border-[#E2E8F4] text-[#9AAAC8] hover:text-[#1A3A6B] hover:border-[#1A3A6B] transition-colors">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/>
          </button>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">

        {/* Quick Nav — CRM only */}
        {canSeeCRM && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push('/reports')}
              className="bg-white rounded-2xl border border-[#E2E8F4] p-3 flex items-center gap-3 hover:border-[#1A3A6B]/30 active:scale-95 transition-all text-left">
              <div className="w-9 h-9 bg-[#EFF6FF] rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart2 size={18} className="text-[#1D4ED8]"/>
              </div>
              <div>
                <div className="text-xs font-bold text-[#0D1B3E]">Reports</div>
                <div className="text-[10px] text-[#9AAAC8]">Analytics</div>
              </div>
            </button>
            <button onClick={() => router.push('/properties')}
              className="bg-white rounded-2xl border border-[#E2E8F4] p-3 flex items-center gap-3 hover:border-[#1A3A6B]/30 active:scale-95 transition-all text-left">
              <div className="w-9 h-9 bg-[#F0FDF4] rounded-xl flex items-center justify-center flex-shrink-0">
                <Home size={18} className="text-[#166534]"/>
              </div>
              <div>
                <div className="text-xs font-bold text-[#0D1B3E]">Properties</div>
                <div className="text-[10px] text-[#9AAAC8]">Listings</div>
              </div>
            </button>
            {isAdmin && (
              <button onClick={() => router.push('/admin')}
                className="col-span-2 bg-white rounded-2xl border border-[#E2E8F4] p-3 flex items-center gap-3 hover:border-[#1A3A6B]/30 active:scale-95 transition-all text-left">
                <div className="w-9 h-9 bg-[#FEF2F2] rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={18} className="text-[#991B1B]"/>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0D1B3E]">Admin Panel</div>
                  <div className="text-[10px] text-[#9AAAC8]">Team overview & notifications</div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* HR Summary */}
        {canSeeHR && (
          <div>
            <div className="text-sm font-bold text-[#0D1B3E] mb-2">HR Overview</div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => router.push('/hr/employees')}
                className="bg-white rounded-2xl border border-[#E2E8F4] p-3 flex flex-col items-center text-center hover:border-[#1A3A6B]/30 active:scale-95 transition-all">
                <div className="w-9 h-9 bg-[#EFF6FF] rounded-xl flex items-center justify-center mb-1.5">
                  <UserCheck size={17} className="text-[#1D4ED8]"/>
                </div>
                <div className="text-lg font-extrabold text-[#0D1B3E]">{hrStats.employeeCount}</div>
                <div className="text-[10px] text-[#9AAAC8] leading-tight">Employees</div>
              </button>
              <button onClick={() => router.push('/hr/attendance')}
                className="bg-white rounded-2xl border border-[#E2E8F4] p-3 flex flex-col items-center text-center hover:border-[#1A3A6B]/30 active:scale-95 transition-all">
                <div className="w-9 h-9 bg-[#F0FDF4] rounded-xl flex items-center justify-center mb-1.5">
                  <Clock size={17} className="text-[#166534]"/>
                </div>
                <div className="text-lg font-extrabold text-[#0D1B3E]">{hrStats.presentToday}</div>
                <div className="text-[10px] text-[#9AAAC8] leading-tight">Present Today</div>
              </button>
              <button onClick={() => router.push('/hr/leave')}
                className="bg-white rounded-2xl border border-[#E2E8F4] p-3 flex flex-col items-center text-center hover:border-[#1A3A6B]/30 active:scale-95 transition-all">
                <div className="w-9 h-9 bg-[#FFFBEB] rounded-xl flex items-center justify-center mb-1.5">
                  <CalendarOff size={17} className="text-[#92400E]"/>
                </div>
                <div className="text-lg font-extrabold text-[#0D1B3E]">{hrStats.pendingLeave}</div>
                <div className="text-[10px] text-[#9AAAC8] leading-tight">Pending Leave</div>
              </button>
            </div>
          </div>
        )}

        {/* Pipeline Donut — CRM only */}
        {canSeeCRM && (
          <div>
            <div className="text-sm font-bold text-[#0D1B3E] mb-2">Leads by Pipeline Stage</div>
            <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
              {total > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-[110px] h-[110px] flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                          dataKey="count" paddingAngle={2}>
                          {chartData.map(e => <Cell key={e.stage} fill={STAGE_COLORS[e.stage] ?? '#ccc'}/>)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-xl font-extrabold text-[#0D1B3E]">{total}</div>
                      <div className="text-[9px] text-[#9AAAC8] text-center leading-tight">Total<br/>Leads</div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {pipelineData.map(p => (
                      <div key={p.stage} className="flex items-center gap-2 text-[11px]">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STAGE_COLORS[p.stage] }}/>
                        <span className="flex-1 truncate text-[#4A5880]">{p.label}</span>
                        <span className="font-semibold text-[#0D1B3E]">{p.count}</span>
                        <span className="text-[#9AAAC8] w-8 text-right">
                          {total ? Math.round(p.count/total*100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm text-[#9AAAC8] mb-3">No leads yet.</p>
                  <button onClick={() => router.push('/leads')}
                    className="text-xs font-bold text-white bg-[#1A3A6B] px-4 py-2 rounded-full">
                    + Add first lead
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Leads — CRM only */}
        {canSeeCRM && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-[#0D1B3E]">Recent Leads</div>
              <button onClick={() => router.push('/leads')} className="text-xs text-[#1F4FA8] font-semibold">
                View All →
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-[#E2E8F4] overflow-hidden">
              {recentLeads.length > 0 ? recentLeads.map((lead: any, i: number) => {
                const badge = STAGE_CONFIG[lead.stage]
                const ci    = i % AVATAR_BG.length
                return (
                  <button key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F4] last:border-0 hover:bg-[#FAFBFE] active:bg-[#F0F4FB] text-left transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: AVATAR_BG[ci], color: AVATAR_TC[ci] }}>
                      {initials(lead.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#0D1B3E] truncate">{lead.full_name}</div>
                      <div className="text-xs text-[#9AAAC8] truncate">{lead.location ?? 'Addis Ababa'}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: badge?.bg, color: badge?.color }}>
                      {badge?.label}
                    </span>
                    <span className="text-[10px] text-[#9AAAC8] flex-shrink-0">{timeAgo(lead.created_at)}</span>
                  </button>
                )
              }) : (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm text-[#9AAAC8]">No leads yet.</p>
                  <button onClick={() => router.push('/leads')}
                    className="mt-3 text-xs font-bold text-[#1F4FA8]">+ Add your first lead</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}