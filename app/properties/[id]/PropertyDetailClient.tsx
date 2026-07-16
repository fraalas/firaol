'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit2, Check, X, Trash2, MapPin, Bed, Bath, Ruler, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PROPERTY_STATUS_CONFIG } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { inputCls, selectCls } from '@/components/ui/FormField'
import { ImageUpload } from '@/components/ui/ImageUpload'
import type { Property } from '@/types/database'

interface Props { property: Property; currentUserId: string; userRole: string }

export function PropertyDetailClient({ property: initial, currentUserId, userRole }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [prop, setProp]         = useState(initial)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDel, setShowDel]   = useState(false)
  const [imgIdx, setImgIdx]     = useState(0)

  const canEdit = prop.agent_id === currentUserId || userRole === 'admin' || userRole === 'manager'

  const [form, setForm] = useState({
    title:       prop.title,
    address:     prop.address ?? '',
    city:        prop.city ?? 'Addis Ababa',
    price:       prop.price?.toString() ?? '',
    price_type:  prop.price_type,
    status:      prop.status,
    bedrooms:    prop.bedrooms?.toString() ?? '',
    bathrooms:   prop.bathrooms?.toString() ?? '',
    area_sqm:    prop.area_sqm?.toString() ?? '',
    description: prop.description ?? '',
  })

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase.from('properties').update({
      ...form,
      price:     form.price     ? parseFloat(form.price)    : null,
      bedrooms:  form.bedrooms  ? parseInt(form.bedrooms)   : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms)  : null,
      area_sqm:  form.area_sqm  ? parseFloat(form.area_sqm) : null,
    }).eq('id', prop.id).select().single()
    if (!error && data) { setProp(data); setEditing(false) }
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('properties').delete().eq('id', prop.id)
    router.push('/properties')
  }

  const sc     = PROPERTY_STATUS_CONFIG[prop.status]
  const images = prop.images ?? []

  return (
    <div className="flex flex-col h-screen bg-[#F5F7FB] max-w-sm mx-auto relative overflow-hidden">

      {/* Hero image area */}
      <div className="bg-gradient-to-br from-[#1A3A6B] to-[#2E6DD4] relative flex-shrink-0">

        {/* Real images carousel or placeholder */}
        {images.length > 0 ? (
          <div className="relative h-52 overflow-hidden">
            <img src={images[imgIdx]} alt={prop.title}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white text-xs">‹</button>
                <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white text-xs">›</button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_,i) => (
                    <span key={i} onClick={() => setImgIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer ${i === imgIdx ? 'bg-white' : 'bg-white/40'}`}/>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center opacity-10 text-8xl">🏠</div>
        )}

        {/* Nav overlay */}
        <div className="absolute top-3 left-0 right-0 flex items-center justify-between px-4">
          <button onClick={() => router.back()}
            className="w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <ArrowLeft size={18}/>
          </button>
          {canEdit && (
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)}
                    className="w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                    <X size={16}/>
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[#1A3A6B] disabled:opacity-60">
                    {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)}
                    className="w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                    <Edit2 size={15}/>
                  </button>
                  <button onClick={() => setShowDel(true)}
                    className="w-9 h-9 bg-red-500/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                    <Trash2 size={15}/>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Price strip */}
        <div className="px-4 pb-5 pt-3">
          {editing ? (
            <div className="flex gap-2">
              <input type="number" value={form.price}
                onChange={e => setForm(p=>({...p,price:e.target.value}))}
                className="text-white text-xl font-extrabold bg-white/20 rounded-xl px-3 py-2 outline-none border border-white/30 w-36"/>
              <select value={form.price_type}
                onChange={e => setForm(p=>({...p,price_type:e.target.value as any}))}
                className="bg-white/20 text-white text-sm rounded-xl px-3 outline-none border border-white/30">
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
          ) : (
            <div>
              <div className="text-white text-2xl font-extrabold">
                {prop.price_type === 'rent' ? `${formatCurrency(prop.price)}/mo` : formatCurrency(prop.price)}
              </div>
              <div className="text-white/60 text-xs mt-0.5 uppercase tracking-wider font-semibold">
                For {prop.price_type === 'rent' ? 'Rent' : 'Sale'}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
            <span className="text-white/50 text-xs">Listed {formatDate(prop.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="bg-white rounded-t-3xl -mt-3 px-4 pt-5 space-y-4">

          {/* Title */}
          {editing ? (
            <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}
              className="text-lg font-bold text-[#0D1B3E] border-b-2 border-[#1A3A6B] outline-none w-full pb-1"/>
          ) : (
            <h1 className="text-lg font-bold text-[#0D1B3E]">{prop.title}</h1>
          )}

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-[#4A5880]">
            <MapPin size={15} className="text-[#9AAAC8] mt-0.5 flex-shrink-0"/>
            {editing ? (
              <div className="flex-1 space-y-2">
                <input value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}
                  placeholder="Street address"
                  className="w-full border-b border-[#E2E8F4] outline-none text-sm pb-1"/>
                <input value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))}
                  placeholder="City"
                  className="w-full border-b border-[#E2E8F4] outline-none text-sm pb-1"/>
              </div>
            ) : (
              <span>{[prop.address, prop.city].filter(Boolean).join(', ') || 'Addis Ababa'}</span>
            )}
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Bed size={18}/>,   label:'Bedrooms',  key:'bedrooms',  val: prop.bedrooms  },
              { icon: <Bath size={18}/>,  label:'Bathrooms', key:'bathrooms', val: prop.bathrooms },
              { icon: <Ruler size={18}/>, label:'Area (m²)', key:'area_sqm',  val: prop.area_sqm  },
            ].map(s => (
              <div key={s.key} className="bg-[#F5F7FB] rounded-2xl p-3 text-center border border-[#E2E8F4]">
                <div className="text-[#9AAAC8] flex justify-center mb-1">{s.icon}</div>
                {editing ? (
                  <input type="number" value={(form as any)[s.key]}
                    onChange={e => setForm(p => ({...p, [s.key]: e.target.value}))}
                    className="w-full text-center text-base font-bold text-[#0D1B3E] bg-transparent outline-none border-b border-[#1A3A6B]"/>
                ) : (
                  <div className="text-base font-bold text-[#0D1B3E]">{s.val ?? '—'}</div>
                )}
                <div className="text-[9px] text-[#9AAAC8] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Status (edit only) */}
          {editing && (
            <div>
              <label className="text-xs font-semibold text-[#9AAAC8] uppercase tracking-wider mb-1.5 block">Status</label>
              <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value as any}))} className={selectCls}>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="text-xs font-semibold text-[#9AAAC8] uppercase tracking-wider mb-2">Description</div>
            {editing ? (
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                rows={4} className={`${inputCls} resize-none`} placeholder="Property details..."/>
            ) : (
              <p className="text-sm text-[#4A5880] leading-relaxed">
                {prop.description || <span className="text-[#9AAAC8] italic">No description added.</span>}
              </p>
            )}
          </div>

          {/* Photo upload */}
          {canEdit && (
            <div>
              <div className="text-xs font-semibold text-[#9AAAC8] uppercase tracking-wider mb-2">Photos</div>
              <ImageUpload
                propertyId={prop.id}
                existingImages={prop.images ?? []}
                onUploadComplete={(urls) => setProp(p => ({ ...p, images: urls }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {showDel && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl p-6 w-full">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500"/>
            </div>
            <h3 className="text-base font-bold text-[#0D1B3E] text-center mb-1">Delete Property?</h3>
            <p className="text-sm text-[#9AAAC8] text-center mb-5">
              This will permanently remove <strong>{prop.title}</strong> and all its photos.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDel(false)}
                className="flex-1 py-3 border-2 border-[#E2E8F4] rounded-xl text-sm font-bold text-[#4A5880]">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 bg-red-500 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
