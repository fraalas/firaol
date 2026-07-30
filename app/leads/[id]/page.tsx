'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, Edit2, Check, X, Trash2, Phone, Mail, MapPin, DollarSign, Tag, User, FileText, Plus, Loader2, Clock, CheckCircle2, Circle } from 'lucide-react'

const STAGES = [
  { key: 'new_lead',       label: 'New Lead',       color: '#1D4ED8', bg: '#EFF6FF' },
  { key: 'contacted',      label: 'Contacted',      color: '#166534', bg: '#F0FDF4' },
  { key: 'interested',     label: 'Interested',     color: '#0F766E', bg: '#F0FDFA' },
  { key: 'property_visit', label: 'Property Visit', color: '#92400E', bg: '#FFFBEB' },
  { key: 'negotiation',    label: 'Negotiation',    color: '#6B21A8', bg: '#FAF5FF' },
  { key: 'closed',         label: 'Closed',         color: '#065F46', bg: '#ECFDF5' },
  { key: 'lost',           label: 'Lost',           color: '#991B1B', bg: '#FEF2F2' },
]

const PIPELINE = ['new_lead','contacted','interested','property_visit','negotiation','closed']

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return days < 7 ? `${days}d ago` : `${Math.floor(days/7)}w ago`
}

export default function LeadDetailPage() {
  const supabase = createClient()
  const router   = useRouter()
  const params   = useParams()
  const id       = params.id as string

  const [lead,       setLead]       = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [agentProfile, setAgentProfile] = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [showDel,    setShowDel]    = useState(false)
  const [showStage,  setShowStage]  = useState(false)
  const [showAct,    setShowAct]    = useState(false)
  const [tab,        setTab]        = useState<'details'|'activities'|'notes'>('details')
  const [form,       setForm]       = useState<any>({})
  const [actForm,    setActForm]    = useState({ title: '', type: 'call', scheduled_at: '', notes: '' })
  const [actSaving,  setActSaving]  = useState(false)
  const [actError,   setActError]   = useState('')
  const [debugInfo,  setDebugInfo]  = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: leadData } = await supabase
        .from('leads').select('*').eq('id', id).single()
      if (!leadData) { router.replace('/leads'); return }
      setLead(leadData)
      setForm({
        full_name: leadData.full_name,
        phone:     leadData.phone ?? '',
        email:     leadData.email ?? '',
        location:  leadData.location ?? '',
        budget:    leadData.budget?.toString() ?? '',
        interest:  leadData.interest ?? '',
        source:    leadData.source ?? 'referral',
        notes:     leadData.notes ?? '',
      })

      if (leadData.agent_id) {
        const { data: agentData } = await supabase
          .from('profiles').select('full_name, phone, role, avatar_url').eq('id', leadData.agent_id).single()
        setAgentProfile(agentData)
      }

      const { data: actsData } = await supabase
        .from('activities').select('*').eq('lead_id', id)
        .order('scheduled_at', { ascending: false })
      setActivities(actsData ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    setSaving(true)
    const { data } = await supabase.from('leads').update({
      ...form,
      budget: form.budget ? parseFloat(form.budget) : null,
    }).eq('id', id).select().single()
    if (data) { setLead(data); setEditing(false) }
    setSaving(false)
  }

  async function handleStageChange(stage: string) {
    await supabase.from('leads').update({ stage }).eq('id', id)
    setLead((prev: any) => ({ ...prev, stage }))
    setShowStage(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('leads').delete().eq('id', id)
    router.replace('/leads')
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault()
    setDebugInfo('Started at ' + new Date().toLocaleTimeString())
    setActSaving(true)
    setActError('')

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData?.user) {
        setActError('Session error: ' + (userError?.message || 'no user found') + '. Try logging in again.')
        setActSaving(false)
        return
      }

      if (!actForm.title || !actForm.scheduled_at) {
        setActError('Title and Date & Time are required.')
        setActSaving(false)
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single()

      if (profileError || !profileData?.company_id) {
        setActError('Could not determine your company. ' + (profileError?.message || 'Profile has no company_id.'))
        setActSaving(false)
        return
      }

      const payload = {
        title: actForm.title,
        type: actForm.type,
        scheduled_at: actForm.scheduled_at,
        notes: actForm.notes || null,
        agent_id: userData.user.id,
        lead_id: id,
        completed: false,
        company_id: profileData.company_id,
      }

      // Insert WITHOUT trying to read the row back immediately —
      // avoids failures caused by RLS blocking the read-after-write.
      const { error: insertError } = await supabase.from('activities').insert(payload)

      if (insertError) {
        setActError('Could not save: ' + insertError.message + (insertError.code ? ' (code ' + insertError.code + ')' : ''))
        setActSaving(false)
        return
      }

      // Re-fetch the full activity list fresh from the database instead
      // of relying on the insert's return value.
      const { data: freshActivities, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', id)
        .order('scheduled_at', { ascending: false })

      if (fetchError) {
        setActError('Saved, but could not refresh the list: ' + fetchError.message + '. Try closing and reopening this lead.')
        setActSaving(false)
        return
      }

      setActivities(freshActivities ?? [])
      setShowAct(false)
      setActForm({ title: '', type: 'call', scheduled_at: '', notes: '' })
      setActError('')
      setDebugInfo('')
    } catch (err: any) {
      setActError('Unexpected error: ' + (err?.message || String(err)))
    }

    setActSaving(false)
  }

  async function toggleActivity(actId: string, completed: boolean) {
    await supabase.from('activities').update({ completed: !completed }).eq('id', actId)
    setActivities(prev => prev.map(a => a.id === actId ? { ...a, completed: !completed } : a))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB]">
      <div className="w-10 h-10 border-4 border-[#075290] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!lead) return null

  const stageCfg = STAGES.find(s => s.key === lead.stage)
  const pipelineIdx = PIPELINE.indexOf(lead.stage)

  return (
    <AppLayout title={lead.full_name}>
      <div className="h-full overflow-y-auto pb-8">

        {/* Hero */}
        <div className="bg-[#075290] px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.back()}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm">
              <ArrowLeft size={16}/> Back
            </button>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)}
                    className="border border-white/30 rounded-lg px-3 py-1.5 text-white text-xs">
                    <X size={13}/>
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="bg-white rounded-lg px-3 py-1.5 text-[#075290] text-xs font-bold flex items-center gap-1">
                    {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>} Save
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)}
                    className="border border-white/30 rounded-lg px-3 py-1.5 text-white text-xs flex items-center gap-1">
                    <Edit2 size={13}/> Edit
                  </button>
                  <button onClick={() => setShowDel(true)}
                    className="border border-red-400/40 rounded-lg px-3 py-1.5 text-red-300 text-xs">
                    <Trash2 size={13}/>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {lead.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">{lead.full_name}</h1>
              <p className="text-white/60 text-sm">{lead.location ?? 'Location not set'}</p>
              <button onClick={() => setShowStage(true)}
                className="mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: stageCfg?.bg, color: stageCfg?.color }}>
                {stageCfg?.label} ▾
              </button>
            </div>
          </div>

          {/* Pipeline progress */}
          {lead.stage !== 'lost' && (
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex justify-between mb-2">
                {PIPELINE.map((s, i) => (
                  <div key={s} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    i <= pipelineIdx ? 'bg-white border-white' : 'border-white/30'
                  }`}>
                    {i <= pipelineIdx && <Check size={12} className="text-[#075290]"/>}
                  </div>
                ))}
              </div>
              <div className="h-1.5 bg-white/20 rounded-full">
                <div className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.max(5, (pipelineIdx / (PIPELINE.length-1)) * 100)}%` }}/>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-[#E2E8F4] flex">
          {(['details','activities','notes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold capitalize border-b-2 transition-colors ${
                tab === t ? 'text-[#075290] border-[#075290]' : 'text-[#9AAAC8] border-transparent'
              }`}>
              {t}
              {t === 'activities' && activities.length > 0 &&
                <span className="ml-1 bg-[#075290] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {activities.length}
                </span>
              }
            </button>
          ))}
        </div>

        {/* Details tab */}
        {tab === 'details' && (
          <div className="p-6 space-y-3 max-w-2xl">
            <div className="bg-white rounded-2xl border border-[#E2E8F4] divide-y divide-[#F0F4FB]">
              {[
                { icon: <Phone size={15}/>,      label: 'Phone',    key: 'phone',    type: 'tel'    },
                { icon: <Mail size={15}/>,       label: 'Email',    key: 'email',    type: 'email'  },
                { icon: <MapPin size={15}/>,     label: 'Location', key: 'location', type: 'text'   },
                { icon: <DollarSign size={15}/>, label: 'Budget',   key: 'budget',   type: 'number' },
                { icon: <Tag size={15}/>,        label: 'Interest', key: 'interest', type: 'text'   },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-[#F5F7FB] rounded-lg flex items-center justify-center text-[#9AAAC8] flex-shrink-0">
                    {f.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#9AAAC8] uppercase font-semibold tracking-wider">{f.label}</div>
                    {editing ? (
                      <input type={f.type} value={form[f.key]}
                        onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                        className="text-sm text-[#0D1B3E] border-b border-[#075290] outline-none w-full bg-transparent mt-0.5"/>
                    ) : (
                      <div className="text-sm text-[#0D1B3E] truncate">
                        {f.key === 'budget' && lead[f.key] ? `$${Number(lead[f.key]).toLocaleString()}` : lead[f.key] || '—'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3">
              <div className="text-[10px] text-[#9AAAC8] uppercase font-semibold tracking-wider mb-1">Source</div>
              {editing ? (
                <select value={form.source} onChange={e => setForm((p: any) => ({ ...p, source: e.target.value }))}
                  className="text-sm text-[#0D1B3E] outline-none bg-transparent w-full border-b border-[#075290]">
                  {['referral','website','social','walk_in','cold_call','other'].map(s => (
                    <option key={s} value={s}>{s.replace('_',' ')}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-[#0D1B3E] capitalize">{(lead.source ?? 'other').replace('_',' ')}</div>
              )}
            </div>

            {/* Assigned agent */}
            {agentProfile && (
              <div className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F5F7FB] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {agentProfile.avatar_url
                      ? <img src={agentProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <User size={15} className="text-[#9AAAC8]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#9AAAC8] uppercase font-semibold tracking-wider">Assigned Agent</div>
                    <div className="text-sm text-[#0D1B3E] font-medium truncate">{agentProfile.full_name}</div>
                    <div className="text-xs text-[#9AAAC8] capitalize">{agentProfile.role?.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-center gap-2 text-xs text-[#9AAAC8]">
              <Clock size={13}/> Created {new Date(lead.created_at).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Activities tab */}
        {tab === 'activities' && (
          <div className="p-6 max-w-2xl">
            <button onClick={() => setShowAct(true)}
              className="w-full bg-[#075290] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 mb-4">
              <Plus size={16}/> Schedule Activity
            </button>
            {activities.length === 0 ? (
              <div className="text-center py-12 text-[#9AAAC8]">
                <p className="text-sm">No activities yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map(act => (
                  <div key={act.id} className={`bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-start gap-3 ${act.completed ? 'opacity-60' : ''}`}>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold text-[#0D1B3E] ${act.completed ? 'line-through' : ''}`}>{act.title}</div>
                      <div className="text-xs text-[#9AAAC8] mt-0.5 capitalize">{act.type.replace('_',' ')}</div>
                      {act.notes && <div className="text-xs text-[#9AAAC8] mt-0.5">{act.notes}</div>}
                      <div className="text-xs text-[#9AAAC8] mt-1 flex items-center gap-1">
                        <Clock size={10}/> {new Date(act.scheduled_at).toLocaleString()}
                      </div>
                    </div>
                    <button onClick={() => toggleActivity(act.id, act.completed)}>
                      {act.completed
                        ? <CheckCircle2 size={20} className="text-[#22C55E]"/>
                        : <Circle size={20} className="text-[#E2E8F4]"/>
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes tab */}
        {tab === 'notes' && (
          <div className="p-6 max-w-2xl">
            <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#9AAAC8] uppercase tracking-wider">Notes</span>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="text-xs text-[#1F4FA8] font-semibold flex items-center gap-1">
                    <Edit2 size={12}/> Edit
                  </button>
                )}
              </div>
              <textarea
                value={editing ? form.notes : lead.notes ?? ''}
                onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))}
                readOnly={!editing}
                rows={8}
                placeholder="Add notes about this lead..."
                className={`w-full text-sm text-[#0D1B3E] outline-none resize-none leading-relaxed placeholder:text-[#9AAAC8] ${
                  editing ? 'border border-[#075290] rounded-xl p-3 bg-[#FAFBFE]' : 'bg-transparent'
                }`}
              />
              {editing && (
                <button onClick={handleSave} disabled={saving}
                  className="mt-3 w-full bg-[#075290] text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>} Save Notes
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stage sheet */}
      {showStage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full md:w-96 rounded-t-3xl md:rounded-2xl p-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0D1B3E]">Move to Stage</h3>
              <button onClick={() => setShowStage(false)} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <div className="space-y-2">
              {STAGES.map(s => (
                <button key={s.key} onClick={() => handleStageChange(s.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    lead.stage === s.key ? 'border-[#075290] bg-[#F5F7FB]' : 'border-[#E2E8F4]'
                  }`}>
                  <div className="w-3 h-3 rounded-full" style={{ background: s.color }}/>
                  <span className="text-sm font-semibold text-[#0D1B3E]">{s.label}</span>
                  {lead.stage === s.key && <Check size={16} className="ml-auto text-[#075290]"/>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add activity sheet */}
      {showAct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full md:w-96 rounded-t-3xl md:rounded-2xl p-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0D1B3E]">Add Activity</h3>
              <button onClick={() => { setShowAct(false); setActError('') }} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            {actError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-3">
                {actError}
              </div>
            )}
            {debugInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-[11px] text-blue-700 mb-3 font-mono break-words">
                {debugInfo}
              </div>
            )}
            <form onSubmit={handleAddActivity} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Title *</label>
                <input required value={actForm.title}
                  onChange={e => setActForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE]"
                  placeholder={`Call with ${lead.full_name}`}/>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Type</label>
                <select value={actForm.type} onChange={e => setActForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none bg-[#FAFBFE]">
                  {['call','meeting','site_visit','follow_up','contract','other'].map(t => (
                    <option key={t} value={t}>{t.replace('_',' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Date & Time *</label>
                <input required type="datetime-local" value={actForm.scheduled_at}
                  onChange={e => setActForm(p => ({ ...p, scheduled_at: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE]"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Notes</label>
                <textarea value={actForm.notes} onChange={e => setActForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE] resize-none"/>
              </div>
              <button type="submit" disabled={actSaving}
                className="w-full bg-[#075290] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {actSaving ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} Save Activity
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDel && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500"/>
            </div>
            <h3 className="text-base font-bold text-[#0D1B3E] text-center mb-1">Delete Lead?</h3>
            <p className="text-sm text-[#9AAAC8] text-center mb-5">
              This will permanently delete <strong>{lead.full_name}</strong>.
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
    </AppLayout>
  )
}