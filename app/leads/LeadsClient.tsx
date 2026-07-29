'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Loader2, X, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Lead, LeadStage, LeadSource } from '@/types/database'

const STAGES: { key: LeadStage | 'all'; label: string }[] = [
  { key: 'all',            label: 'All' },
  { key: 'new_lead',       label: 'New Lead' },
  { key: 'contacted',      label: 'Contacted' },
  { key: 'interested',     label: 'Interested' },
  { key: 'property_visit', label: 'Property Visit' },
  { key: 'negotiation',    label: 'Negotiation' },
  { key: 'closed',         label: 'Closed' },
  { key: 'lost',           label: 'Lost' },
]

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  new_lead:       { bg:'#EFF6FF', text:'#1D4ED8', label:'New Lead' },
  contacted:      { bg:'#F0FDF4', text:'#166534', label:'Contacted' },
  interested:     { bg:'#F0FDFA', text:'#0F766E', label:'Interested' },
  property_visit: { bg:'#FFFBEB', text:'#92400E', label:'Property Visit' },
  negotiation:    { bg:'#FAF5FF', text:'#6B21A8', label:'Negotiation' },
  closed:         { bg:'#ECFDF5', text:'#065F46', label:'Closed' },
  lost:           { bg:'#FEF2F2', text:'#991B1B', label:'Lost' },
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const BG = ['#EFF6FF','#F0FDF4','#F0FDFA','#FFFBEB','#FAF5FF','#FEF2F2']
const TC = ['#1D4ED8','#166534','#0F766E','#92400E','#6B21A8','#991B1B']

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return days < 7 ? `${days}d ago` : `${Math.floor(days/7)}w ago`
}

interface Props { leads: Lead[]; agentId: string; companyId: string }

export function LeadsClient({ leads: initial, agentId, companyId }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [leads,   setLeads]   = useState(initial)
  const [filter,  setFilter]  = useState<LeadStage | 'all'>('all')
  const [search,  setSearch]  = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({
    full_name: '', phone: '', location: '', budget: '',
    interest: '', stage: 'new_lead' as LeadStage, source: 'referral' as LeadSource
  })

  const filtered = leads.filter(l => {
    const matchStage  = filter === 'all' || l.stage === filter
    const matchSearch = !search
      || l.full_name.toLowerCase().includes(search.toLowerCase())
      || (l.location ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStage && matchSearch
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data, error } = await supabase.from('leads').insert({
      ...form,
      agent_id: user.id,
      company_id: companyId,
      budget: form.budget ? parseFloat(form.budget) : null,
    }).select().single()

    if (error) {
      alert('Error: ' + error.message)
      setSaving(false)
      return
    }

    if (data) {
      setLeads(prev => [data as Lead, ...prev])
      setShowAdd(false)
      setForm({ full_name:'', phone:'', location:'', budget:'', interest:'', stage:'new_lead', source:'referral' })
    }
    setSaving(false)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-white border border-[#E2E8F4] rounded-xl px-3 py-2.5">
            <Search size={16} className="text-[#9AAAC8]" />
            <input className="flex-1 text-sm outline-none text-[#0D1B3E] placeholder:text-[#9AAAC8] bg-transparent"
              placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowAdd(true)}
            className="bg-[#075290] text-white rounded-xl px-3 flex items-center gap-1 text-xs font-bold">
            <Plus size={16}/> Add
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {STAGES.map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filter === s.key
                  ? 'bg-[#075290] text-white border-[#075290]'
                  : 'bg-white text-[#4A5880] border-[#E2E8F4]'
              }`}>
              {s.label}
              {s.key !== 'all' && (
                <span className="ml-1 opacity-70">({leads.filter(l => l.stage === s.key).length})</span>
              )}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#9AAAC8] font-medium mb-2 px-1">
          {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-[#9AAAC8]">No leads found.</p>
              <button onClick={() => setShowAdd(true)}
                className="mt-3 text-xs text-[#1F4FA8] font-semibold">+ Add your first lead</button>
            </div>
          )}
          {filtered.map((lead, i) => {
            const badge = BADGE[lead.stage]
            const ci    = i % BG.length
            return (
              <button key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)}
                className="w-full bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-center gap-3 hover:bg-[#FAFBFE] transition-all text-left">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: BG[ci], color: TC[ci] }}>
                  {initials(lead.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0D1B3E] truncate">{lead.full_name}</div>
                  <div className="text-xs text-[#9AAAC8] truncate mt-0.5">
                    {lead.location ?? 'Location not set'}
                    {lead.budget && ` · $${lead.budget.toLocaleString()}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: badge.bg, color: badge.text }}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-[#9AAAC8]">{timeAgo(lead.created_at)}</span>
                </div>
                <ChevronRight size={15} className="text-[#E2E8F4] flex-shrink-0 ml-1" />
              </button>
            )
          })}
        </div>
      </div>

      {showAdd && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Add New Lead</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              {[
                { label:'Full Name *', key:'full_name', type:'text',   required: true  },
                { label:'Phone',       key:'phone',     type:'tel',    required: false },
                { label:'Location',    key:'location',  type:'text',   required: false },
                { label:'Budget ($)',  key:'budget',    type:'number', required: false },
                { label:'Interest',    key:'interest',  type:'text',   required: false, placeholder:'e.g. 3-bed apartment' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    placeholder={(f as any).placeholder ?? ''}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Stage</label>
                <select value={form.stage}
                  onChange={e => setForm(p => ({ ...p, stage: e.target.value as LeadStage }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {STAGES.filter(s => s.key !== 'all').map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Source</label>
                <select value={form.source}
                  onChange={e => setForm(p => ({ ...p, source: e.target.value as LeadSource }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {['referral','website','social','walk_in','cold_call','other'].map(s => (
                    <option key={s} value={s}>{s.replace('_',' ')}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin"/>}
                Save Lead
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}