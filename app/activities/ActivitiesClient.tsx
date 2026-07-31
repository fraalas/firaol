'use client'
import { useState } from 'react'
import { Phone, MapPin, Users, FileText, Bell, Calendar, Plus, X, Loader2, Check, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, ActivityType } from '@/types/database'

const TYPE_CONFIG: Record<ActivityType, { icon: typeof Phone; bg: string; color: string }> = {
  call:       { icon: Phone,     bg: '#EFF6FF', color: '#1D4ED8' },
  meeting:    { icon: Users,     bg: '#F0FDF4', color: '#166534' },
  site_visit: { icon: MapPin,    bg: '#F0FDFA', color: '#0F766E' },
  follow_up:  { icon: Bell,      bg: '#FEF2F2', color: '#DC2626' },
  contract:   { icon: FileText,  bg: '#FAF5FF', color: '#6B21A8' },
  other:      { icon: Calendar,  bg: '#FFFBEB', color: '#92400E' },
}

function formatDay(d: string) {
  const date = new Date(d)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function toLocalDateTimeInput(isoString: string) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Props { activities: any[]; agentId: string; companyId: string }

export function ActivitiesClient({ activities: initial, agentId, companyId }: Props) {
  const supabase = createClient()
  const [activities, setActivities] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [form, setForm] = useState({
    title: '', type: 'call' as ActivityType,
    scheduled_at: '', notes: ''
  })

  // Editing / deleting an existing activity
  const [editingAct, setEditingAct] = useState<any>(null)
  const [editForm, setEditForm] = useState({ title: '', type: 'call' as ActivityType, scheduled_at: '', notes: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Group by day
  const grouped = activities.reduce((acc, act) => {
    const day = new Date(act.scheduled_at).toDateString()
    if (!acc[day]) acc[day] = []
    acc[day].push(act)
    return acc
  }, {} as Record<string, any[]>)

  async function toggleComplete(id: string, completed: boolean) {
    await supabase.from('activities').update({ completed: !completed }).eq('id', id)
    setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: !completed } : a))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setAddError('')

    if (!companyId) {
      setAddError('Could not determine your company. Try refreshing the page.')
      setSaving(false)
      return
    }

    const { data, error } = await supabase.from('activities').insert({
      ...form, agent_id: agentId, company_id: companyId, completed: false
    }).select().single()

    if (error) {
      setAddError('Could not save: ' + error.message + (error.code ? ' (code ' + error.code + ')' : ''))
      setSaving(false)
      return
    }

    if (data) {
      setActivities(prev => [...prev, data].sort((a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ))
      setShowAdd(false)
      setForm({ title: '', type: 'call', scheduled_at: '', notes: '' })
    }
    setSaving(false)
  }

  function openEdit(act: any) {
    setEditingAct(act)
    setEditForm({
      title: act.title ?? '',
      type: act.type ?? 'call',
      scheduled_at: toLocalDateTimeInput(act.scheduled_at),
      notes: act.notes ?? '',
    })
    setEditError('')
  }

  function closeEdit() {
    setEditingAct(null)
    setEditError('')
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingAct) return
    setEditSaving(true)
    setEditError('')

    if (!editForm.title || !editForm.scheduled_at) {
      setEditError('Title and Date & Time are required.')
      setEditSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('activities')
      .update({
        title: editForm.title,
        type: editForm.type,
        scheduled_at: new Date(editForm.scheduled_at).toISOString(),
        notes: editForm.notes || null,
      })
      .eq('id', editingAct.id)
      .select()
      .single()

    if (error) {
      setEditError('Could not save: ' + error.message + (error.code ? ' (code ' + error.code + ')' : ''))
      setEditSaving(false)
      return
    }

    if (data) {
      setActivities(prev => prev.map(a => a.id === data.id ? data : a).sort((a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ))
    }
    setEditingAct(null)
    setEditSaving(false)
  }

  async function handleDelete() {
    if (!editingAct) return
    setEditSaving(true)
    setEditError('')

    const { error } = await supabase.from('activities').delete().eq('id', editingAct.id)

    if (error) {
      setEditError('Could not delete: ' + error.message)
      setEditSaving(false)
      return
    }

    setActivities(prev => prev.filter(a => a.id !== editingAct.id))
    setEditingAct(null)
    setEditSaving(false)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <button onClick={() => setShowAdd(true)}
          className="w-full bg-[#075290] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 mb-4">
          <Plus size={16}/> Schedule Activity
        </button>

        {Object.keys(grouped).length === 0 && (
          <p className="text-center text-sm text-[#9AAAC8] py-16">No activities scheduled.</p>
        )}

        {Object.entries(grouped).map(([day, acts]) => (
          <div key={day} className="mb-4">
            <div className="text-xs font-bold text-[#9AAAC8] uppercase tracking-wider mb-2">
              {formatDay((acts as any[])[0].scheduled_at)} — {new Date((acts as any[])[0].scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="space-y-2">
              {(acts as any[]).map((act) => {
                const cfg = TYPE_CONFIG[act.type as ActivityType] ?? TYPE_CONFIG.other
                const Icon = cfg.icon
                return (
                  <div key={act.id}
                    onClick={() => openEdit(act)}
                    className={`bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[#FAFBFE] transition-colors ${act.completed ? 'opacity-50' : ''}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      <Icon size={17} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#0D1B3E]">{act.title}</div>
                      {act.notes && <div className="text-xs text-[#9AAAC8] mt-0.5">{act.notes}</div>}
                      {act.leads?.full_name && <div className="text-xs text-[#4A5880] mt-0.5">With {act.leads.full_name}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-[#9AAAC8]">{formatTime(act.scheduled_at)}</div>
                      <button onClick={(e) => { e.stopPropagation(); toggleComplete(act.id, act.completed) }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${act.completed ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[#E2E8F4]'}`}>
                        {act.completed && <Check size={12} className="text-white"/>}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Schedule Activity</h3>
              <button onClick={() => { setShowAdd(false); setAddError('') }} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            {addError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-3">
                {addError}
              </div>
            )}
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#4A5880] mb-1 block">Title *</label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE]"
                  placeholder="e.g. Call with Abebe Alemu" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#4A5880] mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as ActivityType }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {Object.keys(TYPE_CONFIG).map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#4A5880] mb-1 block">Date & Time *</label>
                <input required type="datetime-local" value={form.scheduled_at}
                  onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#4A5880] mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE] resize-none" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                {saving && <Loader2 size={16} className="animate-spin"/>}
                Save Activity
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Delete sheet */}
      {editingAct && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Edit Activity</h3>
              <button onClick={closeEdit} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            {editError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-3">
                {editError}
              </div>
            )}
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#4A5880] mb-1 block">Title *</label>
                <input required value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#4A5880] mb-1 block">Type</label>
                <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value as ActivityType }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {Object.keys(TYPE_CONFIG).map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#4A5880] mb-1 block">Date & Time *</label>
                <input required type="datetime-local" value={editForm.scheduled_at}
                  onChange={e => setEditForm(p => ({ ...p, scheduled_at: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#4A5880] mb-1 block">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE] resize-none" />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={handleDelete} disabled={editSaving}
                  className="flex-1 border-2 border-red-200 text-red-500 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  <Trash2 size={15}/> Delete
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-[2] bg-[#075290] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {editSaving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}