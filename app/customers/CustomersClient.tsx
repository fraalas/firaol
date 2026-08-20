'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Loader2, X, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STATUSES: { key: string; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'prospect',    label: 'Prospect' },
  { key: 'active',      label: 'Active' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'reserved',    label: 'Reserved' },
  { key: 'purchased',   label: 'Purchased' },
  { key: 'lost',        label: 'Lost' },
  { key: 'inactive',    label: 'Inactive' },
]

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  prospect:    { bg: '#EFF6FF', text: '#1D4ED8', label: 'Prospect' },
  active:      { bg: '#F0FDF4', text: '#166534', label: 'Active' },
  negotiating: { bg: '#FAF5FF', text: '#6B21A8', label: 'Negotiating' },
  reserved:    { bg: '#FFFBEB', text: '#92400E', label: 'Reserved' },
  purchased:   { bg: '#ECFDF5', text: '#065F46', label: 'Purchased' },
  lost:        { bg: '#FEF2F2', text: '#991B1B', label: 'Lost' },
  inactive:    { bg: '#F5F7FB', text: '#4A5880', label: 'Inactive' },
}

function initials(name: string) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const BG = ['#EFF6FF','#F0FDF4','#F0FDFA','#FFFBEB','#FAF5FF','#FEF2F2']
const TC = ['#1D4ED8','#166534','#0F766E','#92400E','#6B21A8','#991B1B']

interface Props {
  customers: any[]
  properties: { id: string; title: string }[]
  companyId: string
  userId: string
}

export function CustomersClient({ customers: initial, properties, companyId, userId }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [customers, setCustomers] = useState(initial)
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [showAdd,   setShowAdd]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', alt_phone: '', email: '', address: '',
    source: '', interested_property_id: '', budget: '', customer_type: '',
    status: 'prospect', notes: '',
  })

  const propMap = Object.fromEntries(properties.map(p => [p.id, p.title]))

  const filtered = customers.filter(c => {
    const matchStatus = filter === 'all' || c.status === filter
    const matchSearch = !search
      || c.full_name.toLowerCase().includes(search.toLowerCase())
      || (c.phone ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase.from('customers').insert({
      company_id: companyId,
      assigned_agent_id: userId,
      created_by: userId,
      full_name: form.full_name,
      phone: form.phone || null,
      alt_phone: form.alt_phone || null,
      email: form.email || null,
      address: form.address || null,
      source: form.source || null,
      interested_property_id: form.interested_property_id || null,
      budget: form.budget ? parseFloat(form.budget) : null,
      customer_type: form.customer_type || null,
      status: form.status,
      notes: form.notes || null,
      last_contact_date: new Date().toISOString(),
    }).select().single()

    if (error) {
      alert('Error: ' + error.message)
      setSaving(false)
      return
    }

    if (data) {
      setCustomers(prev => [data, ...prev])
      setShowAdd(false)
      setForm({ full_name:'', phone:'', alt_phone:'', email:'', address:'', source:'', interested_property_id:'', budget:'', customer_type:'', status:'prospect', notes:'' })
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
              placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowAdd(true)}
            className="bg-[#1A3A6B] text-white rounded-xl px-3 flex items-center gap-1 text-xs font-bold">
            <Plus size={16}/> Add
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filter === s.key
                  ? 'bg-[#1A3A6B] text-white border-[#1A3A6B]'
                  : 'bg-white text-[#4A5880] border-[#E2E8F4]'
              }`}>
              {s.label}
              {s.key !== 'all' && (
                <span className="ml-1 opacity-70">({customers.filter(c => c.status === s.key).length})</span>
              )}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#9AAAC8] font-medium mb-2 px-1">
          {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-[#9AAAC8]">No customers found.</p>
              <button onClick={() => setShowAdd(true)}
                className="mt-3 text-xs text-[#1F4FA8] font-semibold">+ Add your first customer</button>
            </div>
          )}
          {filtered.map((c, i) => {
            const badge = BADGE[c.status] ?? BADGE.prospect
            const ci    = i % BG.length
            return (
              <button key={c.id} onClick={() => router.push(`/customers/${c.id}`)}
                className="w-full bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-center gap-3 hover:bg-[#FAFBFE] transition-all text-left">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: BG[ci], color: TC[ci] }}>
                  {initials(c.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0D1B3E] truncate">{c.full_name}</div>
                  <div className="text-xs text-[#9AAAC8] truncate mt-0.5">
                    {c.interested_property_id ? propMap[c.interested_property_id] ?? 'Property interest' : (c.phone ?? 'No phone')}
                    {c.budget && ` · $${Number(c.budget).toLocaleString()}`}
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: badge.bg, color: badge.text }}>
                  {badge.label}
                </span>
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
              <h3 className="font-bold text-[#0D1B3E] text-base">Add New Customer</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              {[
                { label:'Full Name *',      key:'full_name',  type:'text'  },
                { label:'Phone',            key:'phone',      type:'tel'   },
                { label:'Alternative Phone',key:'alt_phone',  type:'tel'   },
                { label:'Email',            key:'email',      type:'email' },
                { label:'Address',          key:'address',    type:'text'  },
                { label:'Source',           key:'source',     type:'text', placeholder:'e.g. referral, website' },
                { label:'Budget ($)',       key:'budget',     type:'number'},
                { label:'Customer Type',    key:'customer_type', type:'text', placeholder:'e.g. individual, company' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.key === 'full_name'}
                    placeholder={(f as any).placeholder ?? ''}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Interested Property</label>
                <select value={form.interested_property_id}
                  onChange={e => setForm(p => ({ ...p, interested_property_id: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  <option value="">None</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Status</label>
                <select value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {STATUSES.filter(s => s.key !== 'all').map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Notes</label>
                <textarea value={form.notes} rows={3}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE] resize-none" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#1A3A6B] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin"/>}
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}