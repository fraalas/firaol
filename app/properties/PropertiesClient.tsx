'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, ChevronRight, Bed, Bath, Ruler, MapPin, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PROPERTY_STATUS_CONFIG } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { Property } from '@/types/database'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { FormField, inputCls, selectCls } from '@/components/ui/FormField'
import { EmptyState } from '@/components/ui/EmptyState'

const STATUS_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'sold',      label: 'Sold' },
  { key: 'rented',    label: 'Rented' },
]

const PROP_GRADIENTS = [
  'from-[#075290] to-[#2E6DD4]',
  'from-[#0D2450] to-[#075290]',
  'from-[#1F4FA8] to-[#4A8FE8]',
  'from-[#064E3B] to-[#0F766E]',
]

interface Props { properties: Property[]; agentId: string; userRole: string }

export function PropertiesClient({ properties: initial, agentId, userRole }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [props, setProps]   = useState(initial)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    title: '', address: '', city: 'Addis Ababa', price: '',
    price_type: 'sale' as 'sale' | 'rent', status: 'available' as 'available'|'sold'|'rented',
    bedrooms: '', bathrooms: '', area_sqm: '', description: '',
  })

  const filtered = props.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter
    const matchSearch = !search
      || p.title.toLowerCase().includes(search.toLowerCase())
      || (p.address ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data, error } = await supabase.from('properties').insert({
      ...form, agent_id: agentId,
      price:     form.price     ? parseFloat(form.price) : null,
      bedrooms:  form.bedrooms  ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      area_sqm:  form.area_sqm  ? parseFloat(form.area_sqm) : null,
    }).select().single()
    if (!error && data) {
      setProps(prev => [data, ...prev])
      setShowAdd(false)
      setForm({ title:'', address:'', city:'Addis Ababa', price:'', price_type:'sale', status:'available', bedrooms:'', bathrooms:'', area_sqm:'', description:'' })
    }
    setSaving(false)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {/* Search + Add */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-white border border-[#E2E8F4] rounded-xl px-3 py-2.5">
            <Search size={15} className="text-[#9AAAC8]"/>
            <input className="flex-1 text-sm outline-none text-[#0D1B3E] placeholder:text-[#9AAAC8] bg-transparent"
              placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="bg-[#075290] text-white rounded-xl px-3 flex items-center gap-1 text-xs font-bold">
            <Plus size={16}/> Add
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.key ? 'bg-[#075290] text-white border-[#075290]' : 'bg-white text-[#4A5880] border-[#E2E8F4]'
              }`}>
              {f.label} {f.key !== 'all' && `(${props.filter(p => p.status === f.key).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0
          ? <EmptyState icon="🏠" title="No properties found" subtitle="Add your first property listing"
              action={{ label: '+ Add Property', onClick: () => setShowAdd(true) }}/>
          : (
            <div className="space-y-3">
              {filtered.map((p, i) => {
                const sc = PROPERTY_STATUS_CONFIG[p.status]
                const grad = PROP_GRADIENTS[i % PROP_GRADIENTS.length]
                return (
                  <button key={p.id} onClick={() => router.push(`/properties/${p.id}`)}
                    className="w-full bg-white rounded-2xl border border-[#E2E8F4] overflow-hidden text-left hover:border-[#075290]/30 hover:shadow-sm transition-all">
                    {/* Image placeholder */}
                    <div className={`h-32 bg-gradient-to-br ${grad} flex items-end p-3 relative`}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <span className="text-6xl">🏠</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
                      </div>
                      <div className="z-10">
                        <div className="text-white font-bold text-lg">
                          {p.price_type === 'rent'
                            ? `${formatCurrency(p.price)}/mo`
                            : formatCurrency(p.price)}
                        </div>
                        <div className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">
                          For {p.price_type === 'rent' ? 'Rent' : 'Sale'}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-sm text-[#0D1B3E] truncate">{p.title}</div>
                      <div className="flex items-center gap-1 text-xs text-[#9AAAC8] mt-0.5">
                        <MapPin size={11}/> {p.address ?? p.city}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {p.bedrooms  != null && <span className="flex items-center gap-1 text-xs text-[#4A5880]"><Bed size={12}/> {p.bedrooms} bed</span>}
                        {p.bathrooms != null && <span className="flex items-center gap-1 text-xs text-[#4A5880]"><Bath size={12}/> {p.bathrooms} bath</span>}
                        {p.area_sqm  != null && <span className="flex items-center gap-1 text-xs text-[#4A5880]"><Ruler size={12}/> {p.area_sqm}m²</span>}
                        <ChevronRight size={14} className="text-[#E2E8F4] ml-auto"/>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
      </div>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Property">
        <form onSubmit={handleAdd} className="space-y-3">
          <FormField label="Title" required>
            <input className={inputCls} required value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Bole Atlas Condo"/>
          </FormField>
          <FormField label="Address">
            <input className={inputCls} value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} placeholder="Street address"/>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Price">
              <input className={inputCls} type="number" value={form.price} onChange={e => setForm(p=>({...p,price:e.target.value}))} placeholder="0"/>
            </FormField>
            <FormField label="Type">
              <select className={selectCls} value={form.price_type} onChange={e => setForm(p=>({...p,price_type:e.target.value as any}))}>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Beds">
              <input className={inputCls} type="number" value={form.bedrooms} onChange={e => setForm(p=>({...p,bedrooms:e.target.value}))} placeholder="0"/>
            </FormField>
            <FormField label="Baths">
              <input className={inputCls} type="number" value={form.bathrooms} onChange={e => setForm(p=>({...p,bathrooms:e.target.value}))} placeholder="0"/>
            </FormField>
            <FormField label="m²">
              <input className={inputCls} type="number" value={form.area_sqm} onChange={e => setForm(p=>({...p,area_sqm:e.target.value}))} placeholder="0"/>
            </FormField>
          </div>
          <FormField label="Status">
            <select className={selectCls} value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value as any}))}>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </FormField>
          <FormField label="Description">
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.description}
              onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Property details..."/>
          </FormField>
          <button type="submit" disabled={saving}
            className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 size={16} className="animate-spin"/>} Save Property
          </button>
        </form>
      </BottomSheet>
    </>
  )
}
