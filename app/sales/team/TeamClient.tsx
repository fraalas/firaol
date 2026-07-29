'use client'
import { useState } from 'react'
import { Plus, Loader2, X, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function initials(name: string) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const BG = ['#EFF6FF','#F0FDF4','#F0FDFA','#FFFBEB','#FAF5FF','#FEF2F2']
const TC = ['#1D4ED8','#166534','#0F766E','#92400E','#6B21A8','#991B1B']

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active:   { bg: '#F0FDF4', text: '#166534', label: 'Active' },
  inactive: { bg: '#FFFBEB', text: '#92400E', label: 'Inactive' },
}

interface Props {
  agents: any[]
  companyId: string
  onChange: () => void
}

export function TeamClient({ agents, companyId, onChange }: Props) {
  const supabase = createClient()
  const [showAdd,   setShowAdd]   = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [result,    setResult]    = useState<{ email: string; tempPassword: string } | null>(null)
  const [copied,    setCopied]    = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setResult(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert('Your session expired, please log in again.')
      setCreating(false)
      return
    }

    const res = await fetch('/api/hr/create-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ fullName: form.fullName, email: form.email, phone: form.phone }),
    })
    const json = await res.json()

    if (!res.ok) {
      alert('Error: ' + JSON.stringify(json))
      setCreating(false)
      return
    }

    setResult(json)
    setCreating(false)
  }

  function closeModal() {
    setShowAdd(false)
    setResult(null)
    setForm({ fullName: '', email: '', phone: '' })
    setCopied(false)
    onChange()
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <button onClick={() => setShowAdd(true)}
          className="w-full bg-[#075290] text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold mb-4">
          <Plus size={16}/> Create Agent Account
        </button>

        <div className="space-y-2">
          {agents.length === 0 && (
            <p className="text-sm text-[#9AAAC8] text-center py-16">
              No agents yet. Create your first Sales Agent account above.
            </p>
          )}
          {agents.map((a, i) => {
            const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.active
            const ci = i % BG.length
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: BG[ci], color: TC[ci] }}>
                  {initials(a.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0D1B3E] truncate">{a.full_name}</div>
                  <div className="text-xs text-[#9AAAC8] truncate mt-0.5">{a.phone ?? 'No phone on file'}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {showAdd && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Create Agent Account</h3>
              <button onClick={closeModal} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>

            {!result ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <p className="text-sm text-[#4A5880] mb-2">
                  This creates a login for a new Sales Agent and generates a temporary password for them.
                </p>
                <div>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Full Name *</label>
                  <input type="text" required value={form.fullName}
                    onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Email *</label>
                  <input type="email" required value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Phone</label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]" />
                </div>
                <button type="submit" disabled={creating}
                  className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                  {creating && <Loader2 size={16} className="animate-spin"/>}
                  Create Account
                </button>
              </form>
            ) : (
              <>
                <p className="text-sm text-[#4A5880] mb-4">
                  Account created. Share these credentials with <span className="font-semibold">{form.fullName}</span> — this password won't be shown again.
                </p>
                <div className="bg-[#F5F7FB] rounded-xl p-4 space-y-2 mb-4">
                  <div>
                    <div className="text-[10px] text-[#9AAAC8] uppercase font-bold">Email</div>
                    <div className="text-sm text-[#0D1B3E] font-mono">{result.email}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#9AAAC8] uppercase font-bold">Temporary Password</div>
                    <div className="text-sm text-[#0D1B3E] font-mono">{result.tempPassword}</div>
                  </div>
                </div>
                <button onClick={() => {
                    navigator.clipboard.writeText(`Email: ${result.email}\nPassword: ${result.tempPassword}`)
                    setCopied(true)
                  }}
                  className="w-full bg-white border border-[#E2E8F4] text-[#075290] font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 mb-2">
                  {copied ? <Check size={15}/> : <Copy size={15}/>}
                  {copied ? 'Copied!' : 'Copy credentials'}
                </button>
                <button onClick={closeModal}
                  className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
