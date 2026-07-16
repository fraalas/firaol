'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit2, Check, X, Trash2, Phone, Mail, MapPin,
  DollarSign, Tag, Calendar, User, FileText, Plus, Loader2,
  ChevronRight, Clock, CheckCircle2, Circle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Lead, Activity, LeadStage, LeadSource, ActivityType } from '@/types/database'

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: { key: LeadStage; label: string; color: string; bg: string }[] = [
  { key: 'new_lead',       label: 'New Lead',       color: '#1D4ED8', bg: '#EFF6FF' },
  { key: 'contacted',      label: 'Contacted',      color: '#166534', bg: '#F0FDF4' },
  { key: 'interested',     label: 'Interested',     color: '#0F766E', bg: '#F0FDFA' },
  { key: 'property_visit', label: 'Property Visit', color: '#92400E', bg: '#FFFBEB' },
  { key: 'negotiation',    label: 'Negotiation',    color: '#6B21A8', bg: '#FAF5FF' },
  { key: 'closed',         label: 'Closed',         color: '#065F46', bg: '#ECFDF5' },
  { key: 'lost',           label: 'Lost',           color: '#991B1B', bg: '#FEF2F2' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))

const SOURCES: { key: LeadSource; label: string }[] = [
  { key: 'referral',  label: 'Referral'   },
  { key: 'website',   label: 'Website'    },
  { key: 'social',    label: 'Social'     },
  { key: 'walk_in',   label: 'Walk-in'    },
  { key: 'cold_call', label: 'Cold Call'  },
  { key: 'other',     label: 'Other'      },
]

const ACT_TYPES: { key: ActivityType; label: string; bg: string; color: string }[] = [
  { key: 'call',       label: 'Call',        bg: '#EFF6FF', color: '#1D4ED8' },
  { key: 'meeting',    label: 'Meeting',     bg: '#F0FDF4', color: '#166534' },
  { key: 'site_visit', label: 'Site Visit',  bg: '#F0FDFA', color: '#0F766E' },
  { key: 'follow_up',  label: 'Follow-up',   bg: '#FEF2F2', color: '#DC2626' },
  { key: 'contract',   label: 'Contract',    bg: '#FAF5FF', color: '#6B21A8' },
  { key: 'other',      label: 'Other',       bg: '#FFFBEB', color: '#92400E' },
]
const ACT_MAP = Object.fromEntries(ACT_TYPES.map(a => [a.key, a]))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

// ─── Pipeline progress bar ────────────────────────────────────────────────────

const PIPELINE_ORDER: LeadStage[] = [
  'new_lead','contacted','interested','property_visit','negotiation','closed'
]

function PipelineBar({ stage }: { stage: LeadStage }) {
  if (stage === 'lost') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
        <X size={14} className="text-red-500" />
        <span className="text-xs font-semibold text-red-500">Lead marked as lost</span>
      </div>
    )
  }
  const idx = PIPELINE_ORDER.indexOf(stage)
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        {PIPELINE_ORDER.map((s, i) => {
          const done = i <= idx
          const cfg = STAGE_MAP[s]
          return (
            <div key={s} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? 'border-[#1A3A6B] bg-[#1A3A6B]' : 'border-[#E2E8F4] bg-white'
              }`}>
                {done && <Check size={10} className="text-white" />}
              </div>
              {i < PIPELINE_ORDER.length - 1 && (
                <div className={`absolute`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center">
        {PIPELINE_ORDER.map((s, i) => (
          <div key={s} className="flex items-center" style={{ flex: 1 }}>
            <div className={`h-1.5 rounded-full flex-1 ${i <= idx ? 'bg-[#1A3A6B]' : 'bg-[#E2E8F4]'}`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {PIPELINE_ORDER.map((s, i) => (
          <div key={s} className="flex-1 text-center">
            <span className={`text-[8px] font-medium leading-tight ${i <= idx ? 'text-[#1A3A6B]' : 'text-[#9AAAC8]'}`}>
              {STAGE_MAP[s]?.label.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Editable field ───────────────────────────────────────────────────────────

function EditableField({
  icon, label, value, type = 'text', editing, onChange, placeholder
}: {
  icon: React.ReactNode
  label: string
  value: string
  type?: string
  editing: boolean
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#F0F4FB] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#F0F4FB] flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[#9AAAC8]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-[#9AAAC8] uppercase tracking-wider mb-0.5">{label}</div>
        {editing ? (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder ?? label}
            className="w-full text-sm text-[#0D1B3E] border-b-2 border-[#1A3A6B] outline-none pb-0.5 bg-transparent"
          />
        ) : (
          <div className="text-sm text-[#0D1B3E] truncate">{value || <span className="text-[#9AAAC8]">—</span>}</div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  lead: Lead
  activities: Activity[]
  agentProfile: { full_name: string; phone: string | null; role: string } | null
  currentUserId: string
}

export function LeadDetailClient({ lead: initialLead, activities: initialActs, agentProfile, currentUserId }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [lead, setLead] = useState(initialLead)
  const [activities, setActivities] = useState(initialActs)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showStageSheet, setShowStageSheet] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'activities' | 'notes'>('details')

  // Edit form state
  const [form, setForm] = useState({
    full_name:  lead.full_name,
    phone:      lead.phone ?? '',
    email:      lead.email ?? '',
    location:   lead.location ?? '',
    budget:     lead.budget?.toString() ?? '',
    interest:   lead.interest ?? '',
    source:     lead.source ?? 'referral',
    notes:      lead.notes ?? '',
    stage:      lead.stage,
  })

  // Activity form
  const [actForm, setActForm] = useState({
    title: '', type: 'call' as ActivityType,
    scheduled_at: '', notes: ''
  })
  const [actSaving, setActSaving] = useState(false)

  const stageCfg = STAGE_MAP[lead.stage]

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase
      .from('leads')
      .update({
        full_name: form.full_name,
        phone:     form.phone || null,
        email:     form.email || null,
        location:  form.location || null,
        budget:    form.budget ? parseFloat(form.budget) : null,
        interest:  form.interest || null,
        source:    form.source as LeadSource,
        notes:     form.notes || null,
        stage:     form.stage as LeadStage,
      })
      .eq('id', lead.id)
      .select()
      .single()

    if (!error && data) {
      setLead(data)
      setEditing(false)
    }
    setSaving(false)
  }

  function handleCancel() {
    setForm({
      full_name: lead.full_name,
      phone:     lead.phone ?? '',
      email:     lead.email ?? '',
      location:  lead.location ?? '',
      budget:    lead.budget?.toString() ?? '',
      interest:  lead.interest ?? '',
      source:    lead.source ?? 'referral',
      notes:     lead.notes ?? '',
      stage:     lead.stage,
    })
    setEditing(false)
  }

  async function handleStageChange(stage: LeadStage) {
    setShowStageSheet(false)
    await supabase.from('leads').update({ stage }).eq('id', lead.id)
    setLead(prev => ({ ...prev, stage }))
    setForm(prev => ({ ...prev, stage }))
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('leads').delete().eq('id', lead.id)
    router.push('/leads')
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault()
    setActSaving(true)
    const { data, error } = await supabase
      .from('activities')
      .insert({
        ...actForm,
        agent_id: currentUserId,
        lead_id:  lead.id,
        completed: false,
      })
      .select()
      .single()

    if (!error && data) {
      setActivities(prev => [data, ...prev])
      setShowAddActivity(false)
      setActForm({ title: '', type: 'call', scheduled_at: '', notes: '' })
    }
    setActSaving(false)
  }

  async function toggleActivity(id: string, completed: boolean) {
    await supabase.from('activities').update({ completed: !completed }).eq('id', id)
    setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: !completed } : a))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-[#F5F7FB] max-w-sm mx-auto relative overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="bg-[#1A3A6B] px-4 pt-3 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={handleCancel}
                  className="border border-white/30 rounded-lg px-3 py-1.5 text-white/80 text-xs font-semibold flex items-center gap-1 hover:bg-white/10">
                  <X size={13}/> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="bg-white rounded-lg px-3 py-1.5 text-[#1A3A6B] text-xs font-bold flex items-center gap-1 disabled:opacity-60">
                  {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
                  Save
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)}
                  className="border border-white/30 rounded-lg px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1 hover:bg-white/10">
                  <Edit2 size={13}/> Edit
                </button>
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="border border-red-400/40 rounded-lg px-3 py-1.5 text-red-300 text-xs font-semibold flex items-center gap-1 hover:bg-red-400/10">
                  <Trash2 size={13}/>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lead hero */}
        <div className="flex items-center gap-3 pb-4">
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0">
            {initials(lead.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="text-white font-bold text-base bg-white/20 rounded-lg px-2 py-1 outline-none w-full border border-white/30"
              />
            ) : (
              <h1 className="text-white font-bold text-base leading-tight">{lead.full_name}</h1>
            )}
            <div className="text-white/60 text-xs mt-0.5 truncate">{lead.location ?? 'Location not set'}</div>
            <button
              onClick={() => !editing && setShowStageSheet(true)}
              className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: stageCfg?.bg, color: stageCfg?.color }}
            >
              {stageCfg?.label}
              {!editing && <ChevronRight size={10}/>}
            </button>
          </div>
        </div>

        {/* Pipeline bar */}
        <div className="bg-white/10 rounded-t-2xl px-4 pt-3 pb-3">
          <PipelineBar stage={lead.stage} />
        </div>

        {/* Tabs */}
        <div className="bg-white flex border-b border-[#E2E8F4]">
          {(['details', 'activities', 'notes'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#1A3A6B] border-b-2 border-[#1A3A6B]'
                  : 'text-[#9AAAC8]'
              }`}>
              {tab}
              {tab === 'activities' && activities.length > 0 &&
                <span className="ml-1 bg-[#1A3A6B] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {activities.length}
                </span>
              }
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-8">

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-1">
              <EditableField icon={<Phone size={14}/>} label="Phone" value={editing ? form.phone : lead.phone ?? ''}
                editing={editing} onChange={v => setForm(p => ({ ...p, phone: v }))} type="tel" />
              <EditableField icon={<Mail size={14}/>} label="Email" value={editing ? form.email : lead.email ?? ''}
                editing={editing} onChange={v => setForm(p => ({ ...p, email: v }))} type="email" />
              <EditableField icon={<MapPin size={14}/>} label="Location" value={editing ? form.location : lead.location ?? ''}
                editing={editing} onChange={v => setForm(p => ({ ...p, location: v }))} />
              <EditableField icon={<DollarSign size={14}/>} label="Budget" value={editing ? form.budget : lead.budget ? `$${lead.budget.toLocaleString()}` : ''}
                editing={editing} onChange={v => setForm(p => ({ ...p, budget: v }))} type="number" />
              <EditableField icon={<Tag size={14}/>} label="Interest" value={editing ? form.interest : lead.interest ?? ''}
                editing={editing} onChange={v => setForm(p => ({ ...p, interest: v }))} placeholder="e.g. 3-bed apartment, Bole" />
            </div>

            {/* Source */}
            <div className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4FB] flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-[#9AAAC8]" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-[#9AAAC8] uppercase tracking-wider mb-0.5">Lead Source</div>
                  {editing ? (
                    <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                      className="text-sm text-[#0D1B3E] border-b-2 border-[#1A3A6B] outline-none bg-transparent w-full">
                      {SOURCES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  ) : (
                    <div className="text-sm text-[#0D1B3E] capitalize">{(lead.source ?? 'other').replace('_', ' ')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Assigned agent */}
            {agentProfile && (
              <div className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F4FB] flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-[#9AAAC8]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-[#9AAAC8] uppercase tracking-wider mb-0.5">Assigned Agent</div>
                    <div className="text-sm text-[#0D1B3E] font-medium">{agentProfile.full_name}</div>
                    <div className="text-xs text-[#9AAAC8] capitalize">{agentProfile.role}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#9AAAC8]">
                <Calendar size={13}/> Created {formatDate(lead.created_at)}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#9AAAC8]">
                <Clock size={13}/> Updated {timeAgo(lead.updated_at)}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITIES TAB */}
        {activeTab === 'activities' && (
          <div className="p-4">
            <button onClick={() => setShowAddActivity(true)}
              className="w-full bg-[#1A3A6B] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 mb-4">
              <Plus size={16}/> Add Activity
            </button>

            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={36} className="text-[#E2E8F4] mx-auto mb-3"/>
                <p className="text-sm text-[#9AAAC8]">No activities yet.</p>
                <p className="text-xs text-[#9AAAC8] mt-1">Schedule a call, visit, or meeting.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map(act => {
                  const cfg = ACT_MAP[act.type as ActivityType] ?? ACT_MAP.other
                  return (
                    <div key={act.id}
                      className={`bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-start gap-3 ${act.completed ? 'opacity-60' : ''}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.bg }}>
                        <span style={{ color: cfg.color, fontSize: 15 }}>
                          {cfg.key === 'call' ? '📞' :
                           cfg.key === 'meeting' ? '👥' :
                           cfg.key === 'site_visit' ? '📍' :
                           cfg.key === 'follow_up' ? '🔔' :
                           cfg.key === 'contract' ? '📄' : '📅'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold text-[#0D1B3E] ${act.completed ? 'line-through' : ''}`}>
                          {act.title}
                        </div>
                        {act.notes && <div className="text-xs text-[#9AAAC8] mt-0.5">{act.notes}</div>}
                        <div className="text-xs text-[#9AAAC8] mt-1 flex items-center gap-1">
                          <Clock size={10}/> {formatDateTime(act.scheduled_at)}
                        </div>
                      </div>
                      <button onClick={() => toggleActivity(act.id, act.completed)}
                        className="flex-shrink-0 mt-0.5">
                        {act.completed
                          ? <CheckCircle2 size={20} className="text-[#22C55E]"/>
                          : <Circle size={20} className="text-[#E2E8F4]"/>
                        }
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="p-4">
            <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#9AAAC8] uppercase tracking-wider">
                  <FileText size={13}/> Notes
                </div>
                {!editing && (
                  <button onClick={() => setEditing(true)}
                    className="text-xs text-[#1F4FA8] font-semibold flex items-center gap-1">
                    <Edit2 size={12}/> Edit
                  </button>
                )}
              </div>
              <textarea
                value={editing ? form.notes : lead.notes ?? ''}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                readOnly={!editing}
                rows={10}
                placeholder="Add notes about this lead — requirements, preferences, follow-up reminders..."
                className={`w-full text-sm text-[#0D1B3E] outline-none resize-none leading-relaxed placeholder:text-[#9AAAC8] ${
                  editing
                    ? 'border border-[#1A3A6B] rounded-xl p-3 bg-[#FAFBFE]'
                    : 'bg-transparent'
                }`}
              />
              {editing && (
                <button onClick={handleSave} disabled={saving}
                  className="mt-3 w-full bg-[#1A3A6B] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>}
                  Save Notes
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Stage change sheet ───────────────────────────────────────────── */}
      {showStageSheet && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Move to Stage</h3>
              <button onClick={() => setShowStageSheet(false)} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <div className="space-y-2">
              {STAGES.map(s => (
                <button key={s.key} onClick={() => handleStageChange(s.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all ${
                    lead.stage === s.key
                      ? 'border-[#1A3A6B] bg-[#F5F7FB]'
                      : 'border-[#E2E8F4] bg-white hover:bg-[#FAFBFE]'
                  }`}>
                  <div className="w-3 h-3 rounded-full" style={{ background: s.color }}/>
                  <span className="text-sm font-semibold text-[#0D1B3E]">{s.label}</span>
                  {lead.stage === s.key && <Check size={16} className="ml-auto text-[#1A3A6B]"/>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Add activity sheet ───────────────────────────────────────────── */}
      {showAddActivity && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Add Activity</h3>
              <button onClick={() => setShowAddActivity(false)} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddActivity} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Title *</label>
                <input required value={actForm.title} onChange={e => setActForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]"
                  placeholder={`e.g. Call with ${lead.full_name}`} />
              </div>

              {/* Type pills */}
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Type</label>
                <div className="flex flex-wrap gap-2">
                  {ACT_TYPES.map(t => (
                    <button key={t.key} type="button"
                      onClick={() => setActForm(p => ({ ...p, type: t.key }))}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${
                        actForm.type === t.key
                          ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white'
                          : 'border-[#E2E8F4] text-[#4A5880]'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Date & Time *</label>
                <input required type="datetime-local" value={actForm.scheduled_at}
                  onChange={e => setActForm(p => ({ ...p, scheduled_at: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]" />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Notes</label>
                <textarea value={actForm.notes} onChange={e => setActForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A3A6B] bg-[#FAFBFE] resize-none" />
              </div>

              <button type="submit" disabled={actSaving}
                className="w-full bg-[#1A3A6B] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {actSaving ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                Save Activity
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl p-6 w-full shadow-xl">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-[#0D1B3E] text-center mb-1">Delete Lead?</h3>
            <p className="text-sm text-[#9AAAC8] text-center mb-5">
              This will permanently delete <strong>{lead.full_name}</strong> and all linked activities.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 border-2 border-[#E2E8F4] rounded-xl text-sm font-bold text-[#4A5880]">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 bg-red-500 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
