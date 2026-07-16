'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { STAGE_CONFIG, ACTIVITY_CONFIG } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { LeadStage, ActivityType } from '@/types/database'

const STAGE_COLORS: Record<string, string> = {
  new_lead:'#1F4FA8', contacted:'#60A5FA', interested:'#14B8A6',
  property_visit:'#F59E0B', negotiation:'#A855F7', closed:'#22C55E', lost:'#EF4444'
}

interface Props {
  stats: {
    totalLeads: number; closedDeals: number; convRate: number; totalRevenue: number
    thisMonthLeads: number; lastMonthLeads: number
    totalProperties: number; availableProperties: number
    totalActivities: number; completedActivities: number
  }
  stageData:   { stage: string; count: number }[]
  sourceData:  { source: string; count: number }[]
  monthlyData: { label: string; count: number }[]
  actData:     { type: string; count: number; completed: number }[]
}

function StatCard({ value, label, sub, color = '#1A3A6B' }: { value: string|number; label: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4 text-center">
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-xs font-semibold text-[#4A5880] mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-[#9AAAC8] mt-0.5">{sub}</div>}
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <div className="text-sm font-bold text-[#0D1B3E] mb-3">{title}</div>
}

function ProgressBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round(count / max * 100) : 0
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="text-xs text-[#4A5880] w-24 flex-shrink-0 capitalize">{label.replace('_',' ')}</div>
      <div className="flex-1 h-2 bg-[#F0F4FB] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <div className="text-xs font-semibold text-[#4A5880] w-8 text-right">{count}</div>
    </div>
  )
}

export function ReportsClient({ stats, stageData, sourceData, monthlyData, actData }: Props) {
  const totalLeads = stageData.reduce((s, d) => s + d.count, 0)
  const chartData  = stageData.filter(d => d.count > 0)
  const monthChange = stats.lastMonthLeads > 0
    ? Math.round((stats.thisMonthLeads - stats.lastMonthLeads) / stats.lastMonthLeads * 100)
    : 0

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-5">

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={stats.totalLeads} label="Total Leads"
          sub={`${stats.thisMonthLeads} this month ${monthChange >= 0 ? '↑' : '↓'}${Math.abs(monthChange)}%`}/>
        <StatCard value={`${stats.convRate}%`} label="Conversion Rate" color="#065F46"/>
        <StatCard value={stats.closedDeals} label="Closed Deals" color="#1D4ED8"/>
        <StatCard value={stats.totalRevenue > 0 ? `$${Math.round(stats.totalRevenue/1000)}K` : '—'} label="Pipeline Value" color="#92400E"/>
      </div>

      {/* Pipeline Donut */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
        <SectionTitle title="Leads by Pipeline Stage"/>
        {totalLeads > 0 ? (
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="count" paddingAngle={2}>
                    {chartData.map(d => <Cell key={d.stage} fill={STAGE_COLORS[d.stage] ?? '#ccc'}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-lg font-extrabold text-[#0D1B3E]">{totalLeads}</div>
                <div className="text-[8px] text-[#9AAAC8]">Total</div>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {stageData.map(d => (
                <div key={d.stage} className="flex items-center gap-2 text-[10px] text-[#4A5880]">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STAGE_COLORS[d.stage]}}/>
                  <span className="flex-1 capitalize">{(STAGE_CONFIG[d.stage as LeadStage]?.label ?? d.stage)}</span>
                  <span className="font-semibold text-[#0D1B3E]">{d.count}</span>
                  <span className="text-[#9AAAC8]">({totalLeads ? Math.round(d.count/totalLeads*100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#9AAAC8] text-center py-6">No lead data yet.</p>
        )}
      </div>

      {/* Monthly trend */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
        <SectionTitle title="Monthly Lead Trend"/>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FB" vertical={false}/>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9AAAC8' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 10, fill: '#9AAAC8' }} axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F4' }} cursor={{ fill: '#F0F4FB' }}/>
            <Bar dataKey="count" name="Leads" fill="#1A3A6B" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lead sources */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
        <SectionTitle title="Lead Sources"/>
        {sourceData.map(s => (
          <ProgressBar key={s.source} label={s.source.replace('_',' ')} count={s.count}
            max={Math.max(...sourceData.map(x => x.count), 1)} color="#1A3A6B"/>
        ))}
      </div>

      {/* Properties stats */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
        <SectionTitle title="Properties"/>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F5F7FB] rounded-xl p-3 text-center">
            <div className="text-xl font-extrabold text-[#1A3A6B]">{stats.totalProperties}</div>
            <div className="text-xs text-[#9AAAC8]">Total Listed</div>
          </div>
          <div className="bg-[#F5F7FB] rounded-xl p-3 text-center">
            <div className="text-xl font-extrabold text-[#065F46]">{stats.availableProperties}</div>
            <div className="text-xs text-[#9AAAC8]">Available</div>
          </div>
        </div>
      </div>

      {/* Activity breakdown */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
        <SectionTitle title="Activity Breakdown"/>
        <div className="flex items-center justify-between text-xs text-[#9AAAC8] mb-3 px-1">
          <span>{stats.totalActivities} total</span>
          <span>{stats.completedActivities} completed ({stats.totalActivities > 0 ? Math.round(stats.completedActivities/stats.totalActivities*100) : 0}%)</span>
        </div>
        {actData.filter(a => a.count > 0).map(a => {
          const cfg = ACTIVITY_CONFIG[a.type as ActivityType]
          const pct = a.count > 0 ? Math.round(a.completed / a.count * 100) : 0
          return (
            <div key={a.type} className="flex items-center gap-3 mb-2.5">
              <span className="text-sm">{cfg?.emoji ?? '📅'}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#4A5880] capitalize">{a.type.replace('_',' ')}</span>
                  <span className="text-[#9AAAC8]">{a.completed}/{a.count}</span>
                </div>
                <div className="h-1.5 bg-[#F0F4FB] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#1A3A6B]" style={{ width: `${pct}%`}}/>
                </div>
              </div>
            </div>
          )
        })}
        {actData.every(a => a.count === 0) && (
          <p className="text-sm text-[#9AAAC8] text-center py-4">No activities yet.</p>
        )}
      </div>
    </div>
  )
}
