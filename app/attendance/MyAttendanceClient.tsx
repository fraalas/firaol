'use client'
import { useState } from 'react'
import { LogIn, LogOut, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getEATDateString, formatEATTime, formatEATFullDate } from '@/lib/timezone'

interface Props {
  employee: any
  companyId: string
  today: any | null
  history: any[]
  onChange: () => void
}

export function MyAttendanceClient({ employee, companyId, today, history, onChange }: Props) {
  const supabase = createClient()
  const [busy, setBusy] = useState(false)

  async function handleCheckIn() {
    setBusy(true)
    const now = new Date()
    const { error } = await supabase.from('attendance').insert({
      company_id:  companyId,
      employee_id: employee.id,
      date:        getEATDateString(now),
      check_in:    now.toISOString(),
      status:      'present',
    })
    if (error) alert('Error: ' + error.message)
    setBusy(false)
    onChange()
  }

  async function handleCheckOut() {
    if (!today) return
    setBusy(true)
    const now = new Date()

    // work_hours is a generated column in the database — computed
    // automatically from check_in/check_out. Do NOT send it here.
    const { error } = await supabase.from('attendance')
      .update({ check_out: now.toISOString() })
      .eq('id', today.id)

    if (error) alert('Error: ' + error.message)
    setBusy(false)
    onChange()
  }

  const state = !today ? 'not_checked_in' : !today.check_out ? 'checked_in' : 'completed'

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 max-w-md mx-auto w-full">
      <div className="bg-white rounded-2xl border border-[#E2E8F4] p-6 text-center mb-6">
        <div className="text-xs font-semibold text-[#9AAAC8] mb-1">
          {formatEATFullDate()} · EAT
        </div>

        {state === 'not_checked_in' && (
          <>
            <Clock size={40} className="mx-auto text-[#9AAAC8] mb-3" />
            <p className="text-sm text-[#4A5880] mb-5">You haven't checked in today.</p>
            <button onClick={handleCheckIn} disabled={busy}
              className="w-full bg-[#1A3A6B] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin"/> : <LogIn size={18}/>}
              Check In
            </button>
          </>
        )}

        {state === 'checked_in' && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-[#166534] mb-3" />
            <p className="text-sm text-[#4A5880] mb-1">Checked in at</p>
            <p className="text-2xl font-bold text-[#0D1B3E] mb-5">{formatEATTime(today.check_in)}</p>
            <button onClick={handleCheckOut} disabled={busy}
              className="w-full bg-[#1A3A6B] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin"/> : <LogOut size={18}/>}
              Check Out
            </button>
          </>
        )}

        {state === 'completed' && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-[#166534] mb-3" />
            <p className="text-sm text-[#4A5880] mb-1">Day complete</p>
            <p className="text-base font-semibold text-[#0D1B3E] mb-1">
              {formatEATTime(today.check_in)} – {formatEATTime(today.check_out)}
            </p>
            {today.work_hours && (
              <p className="text-2xl font-bold text-[#1A3A6B]">{today.work_hours}h worked</p>
            )}
          </>
        )}
      </div>

      <div className="text-xs font-semibold text-[#9AAAC8] mb-2 px-1">Recent History</div>
      <div className="space-y-2">
        {history.length === 0 && (
          <p className="text-sm text-[#9AAAC8] text-center py-8">No attendance history yet.</p>
        )}
        {history.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-[#E2E8F4] px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-[#0D1B3E]">{r.date}</span>
            <span className="text-xs text-[#9AAAC8]">
              {formatEATTime(r.check_in)} – {formatEATTime(r.check_out)}
              {r.work_hours && ` · ${r.work_hours}h`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}