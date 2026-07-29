'use client'
import { useState } from 'react'
import { Plus, Loader2, X, Check, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const LEAVE_TYPES = ['Annual', 'Sick', 'Personal', 'Unpaid', 'Maternity', 'Paternity', 'Other']

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#FFFBEB', text: '#92400E', label: 'Pending' },
  approved: { bg: '#F0FDF4', text: '#166534', label: 'Approved' },
  rejected: { bg: '#FEF2F2', text: '#991B1B', label: 'Rejected' },
}

function daysBetween(start: string, end: string) {
  const s = new Date(start), e = new Date(end)
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
}

interface Props {
  employee: any | null
  companyId: string
  myRequests: any[]
  allRequests: any[]
  employees: { id: string; full_name: string }[]
  canManage: boolean
  notFoundEmployee: boolean
  onChange: () => void
}

export function LeaveClient({
  employee, companyId, myRequests, allRequests, employees, canManage, notFoundEmployee, onChange,
}: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'mine' | 'all'>('mine')
  const [showAdd, setShowAdd] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [busyId,  setBusyId]  = useState<string | null>(null)
  const [form, setForm] = useState({
    leave_type: LEAVE_TYPES[0], start_date: '', end_date: '', reason: '',
  })

  const empMap = Object.fromEntries(employees.map(e => [e.id, e.full_name]))

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!employee) return
    setSaving(true)

    const { data, error } = await supabase.from('leave_requests').insert({
      company_id:  companyId,
      employee_id: employee.id,
      leave_type:  form.leave_type,
      start_date:  form.start_date,
      end_date:    form.end_date,
      reason:      form.reason || null,
      status:      'pending',
    }).select().single()

    if (error) {
      alert('Error: ' + error.message)
      setSaving(false)
      return
    }

    setShowAdd(false)
    setForm({ leave_type: LEAVE_TYPES[0], start_date: '', end_date: '', reason: '' })
    setSaving(false)
    onChange()
  }

  async function handleDecision(id: string, status: 'approved' | 'rejected') {
    setBusyId(id)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('leave_requests').update({
      status, approved_by: user?.id ?? null, approved_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) alert('Error: ' + error.message)
    setBusyId(null)
    onChange()
  }

  const list = tab === 'mine' ? myRequests : allRequests

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {canManage && (
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('mine')}
              className={`flex-1 text-sm font-semibold py-2.5 rounded-xl border transition-colors ${
                tab === 'mine' ? 'bg-[#075290] text-white border-[#075290]' : 'bg-white text-[#4A5880] border-[#E2E8F4]'
              }`}>My Requests</button>
            <button onClick={() => setTab('all')}
              className={`flex-1 text-sm font-semibold py-2.5 rounded-xl border transition-colors ${
                tab === 'all' ? 'bg-[#075290] text-white border-[#075290]' : 'bg-white text-[#4A5880] border-[#E2E8F4]'
              }`}>All Requests
              {allRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-1.5 bg-[#FFFBEB] text-[#92400E] text-[10px] px-1.5 py-0.5 rounded-full">
                  {allRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        )}

        {tab === 'mine' && !notFoundEmployee && (
          <button onClick={() => setShowAdd(true)}
            className="w-full bg-[#075290] text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold mb-4">
            <Plus size={16}/> Request Leave
          </button>
        )}

        {tab === 'mine' && notFoundEmployee && (
          <p className="text-sm text-[#9AAAC8] text-center py-8">
            No employee record is linked to your account yet.<br/>Contact HR to get set up.
          </p>
        )}

        <div className="space-y-2">
          {list.length === 0 && (
            <p className="text-sm text-[#9AAAC8] text-center py-12">No leave requests found.</p>
          )}
          {list.map(r => {
            const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[#0D1B3E]">
                    {tab === 'all' ? (empMap[r.employee_id] ?? 'Unknown') : r.leave_type}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                </div>
                <div className="text-xs text-[#9AAAC8] mb-1">
                  {tab === 'all' && `${r.leave_type} · `}
                  {r.start_date} → {r.end_date} {r.days ? `(${r.days}d)` : ''}
                </div>
                {r.reason && <div className="text-xs text-[#4A5880] mt-1">{r.reason}</div>}
                {tab === 'all' && r.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleDecision(r.id, 'approved')} disabled={busyId === r.id}
                      className="flex-1 bg-[#F0FDF4] text-[#166534] text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                      {busyId === r.id ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>} Approve
                    </button>
                    <button onClick={() => handleDecision(r.id, 'rejected')} disabled={busyId === r.id}
                      className="flex-1 bg-[#FEF2F2] text-[#991B1B] text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                      {busyId === r.id ? <Loader2 size={13} className="animate-spin"/> : <XCircle size={13}/>} Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showAdd && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Request Leave</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Leave Type</label>
                <select value={form.leave_type}
                  onChange={e => setForm(p => ({ ...p, leave_type: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Start Date *</label>
                  <input type="date" required value={form.start_date}
                    onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">End Date *</label>
                  <input type="date" required value={form.end_date}
                    onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]" />
                </div>
              </div>
              {form.start_date && form.end_date && (
                <p className="text-xs text-[#9AAAC8]">{daysBetween(form.start_date, form.end_date)} day(s)</p>
              )}
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Reason</label>
                <textarea value={form.reason} rows={3}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE] resize-none" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin"/>}
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}