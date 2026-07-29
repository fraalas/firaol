'use client'
import { useState } from 'react'
import { Users, TrendingUp, Target, Award, Search, Bell } from 'lucide-react'
import { initials, AVATAR_BG, AVATAR_TC } from '@/lib/utils'
import { NotifyPanel } from '@/components/ui/NotifyPanel'

interface Agent {
  id: string; full_name: string; phone: string|null; role: string
  totalLeads: number; closedDeals: number; activeLeads: number; convRate: number
}

export function AdminClient({ agents, totalLeads }: { agents: Agent[]; totalLeads: number }) {
  const [search, setSearch] = useState('')
  const [tab, setTab]       = useState<'team'|'notify'>('team')

  const topAgent = [...agents].sort((a, b) => b.closedDeals - a.closedDeals)[0]
  const filtered = agents.filter(a =>
    !search || a.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
    admin:   { bg: '#FEF2F2', color: '#991B1B' },
    manager: { bg: '#FFFBEB', color: '#92400E' },
    agent:   { bg: '#EFF6FF', color: '#1D4ED8' },
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-[#E2E8F4] flex">
        {[
          { key: 'team',   label: 'Team',          icon: Users },
          { key: 'notify', label: 'Send Notifications', icon: Bell },
        ].map((t: any) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              tab === t.key ? 'text-[#075290] border-[#075290]' : 'text-[#9AAAC8] border-transparent'
            }`}>
            <t.icon size={14}/>{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        {tab === 'team' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4 text-center">
                <div className="text-2xl font-extrabold text-[#075290]">{agents.length}</div>
                <div className="text-xs text-[#9AAAC8]">Total Agents</div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4 text-center">
                <div className="text-2xl font-extrabold text-[#065F46]">{totalLeads}</div>
                <div className="text-xs text-[#9AAAC8]">Total Leads</div>
              </div>
            </div>

            {topAgent && topAgent.closedDeals > 0 && (
              <div className="bg-gradient-to-r from-[#075290] to-[#2E6DD4] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {initials(topAgent.full_name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Award size={13} className="text-yellow-300"/>
                    <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider">Top Performer</span>
                  </div>
                  <div className="text-white font-bold text-sm">{topAgent.full_name}</div>
                  <div className="text-white/60 text-xs">{topAgent.closedDeals} closed · {topAgent.convRate}% conversion</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white border border-[#E2E8F4] rounded-xl px-3 py-2.5">
              <Search size={15} className="text-[#9AAAC8]"/>
              <input className="flex-1 text-sm outline-none text-[#0D1B3E] placeholder:text-[#9AAAC8] bg-transparent"
                placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>

            <div className="space-y-3">
              {filtered.map((agent, i) => {
                const rb = ROLE_BADGE[agent.role] ?? ROLE_BADGE.agent
                const ci = i % AVATAR_BG.length
                return (
                  <div key={agent.id} className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: AVATAR_BG[ci], color: AVATAR_TC[ci] }}>
                        {initials(agent.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#0D1B3E] truncate">{agent.full_name}</div>
                        <div className="text-xs text-[#9AAAC8]">{agent.phone ?? 'No phone'}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full capitalize"
                        style={{ background: rb.bg, color: rb.color }}>{agent.role}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: <Users size={12}/>,      label: 'Total',  val: agent.totalLeads,  color: '#075290' },
                        { icon: <Target size={12}/>,     label: 'Active', val: agent.activeLeads, color: '#1D4ED8' },
                        { icon: <TrendingUp size={12}/>, label: 'Closed', val: agent.closedDeals, color: '#065F46' },
                      ].map(s => (
                        <div key={s.label} className="bg-[#F5F7FB] rounded-xl p-2 text-center">
                          <div className="flex justify-center mb-0.5" style={{ color: s.color }}>{s.icon}</div>
                          <div className="text-sm font-extrabold" style={{ color: s.color }}>{s.val}</div>
                          <div className="text-[9px] text-[#9AAAC8]">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {agent.totalLeads > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-[#9AAAC8] mb-1">
                          <span>Conversion rate</span><span>{agent.convRate}%</span>
                        </div>
                        <div className="h-1.5 bg-[#F0F4FB] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#075290]" style={{ width: `${agent.convRate}%` }}/>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'notify' && (
          <NotifyPanel agents={agents.filter(a => a.phone).map(a => ({
            id: a.id, full_name: a.full_name, phone: a.phone
          }))} />
        )}
      </div>
    </div>
  )
}
