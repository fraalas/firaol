'use client'
import { useState } from 'react'
import { Search, Plus, Loader2, X, KeyRound, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const DEPARTMENTS = ['Sales', 'Marketing', 'Finance', 'Operations', 'HR', 'Management']

const LOGIN_ROLES = [
  { value: 'staff',           label: 'Staff (Attendance only)' },
  { value: 'agent',           label: 'Sales Agent' },
  { value: 'sales_manager',   label: 'Sales Manager' },
  { value: 'hr',              label: 'HR Manager' },
  { value: 'general_manager', label: 'General Manager' },
  { value: 'ceo',             label: 'CEO' },
]

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'active',     label: 'Active' },
  { key: 'inactive',   label: 'Inactive' },
  { key: 'terminated', label: 'Terminated' },
]

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active:     { bg: '#F0FDF4', text: '#166534', label: 'Active' },
  inactive:   { bg: '#FFFBEB', text: '#92400E', label: 'Inactive' },
  terminated: { bg: '#FEF2F2', text: '#991B1B', label: 'Terminated' },
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const BG = ['#EFF6FF','#F0FDF4','#F0FDFA','#FFFBEB','#FAF5FF','#FEF2F2']
const TC = ['#1D4ED8','#166534','#0F766E','#92400E','#6B21A8','#991B1B']

interface Props { employees: any[]; companyId: string }

export function EmployeesClient({ employees: initial, companyId }: Props) {
  const supabase = createClient()
  const [employees, setEmployees] = useState(initial)
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [showAdd,   setShowAdd]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', department: DEPARTMENTS[0],
    job_title: '', salary: '', hire_date: '', status: 'active',
  })

  const [loginTarget, setLoginTarget] = useState<any | null>(null)
  const [loginRole,   setLoginRole]   = useState('agent')
  const [creating,    setCreating]    = useState(false)
  const [result,      setResult]      = useState<{ email: string; tempPassword: string } | null>(null)
  const [copied,      setCopied]      = useState(false)

  const filtered = employees.filter(e => {
    const matchStatus = filter === 'all' || e.status === filter
    const matchSearch = !search
      || e.full_name.toLowerCase().includes(search.toLowerCase())
      || (e.job_title ?? '').toLowerCase().includes(search.toLowerCase())
      || (e.department ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase.from('employees').insert({
      ...form,
      company_id: companyId,
      salary: form.salary ? parseFloat(form.salary) : 0,
      hire_date: form.hire_date || null,
    }).select().single()

    if (error) {
      alert('Error: ' + error.message)
      setSaving(false)
      return
    }

    if (data) {
      setEmployees(prev => [data, ...prev])
      setShowAdd(false)
      setForm({ full_name:'', email:'', phone:'', department: DEPARTMENTS[0], job_title:'', salary:'', hire_date:'', status:'active' })
    }
    setSaving(false)
  }

  async function handleCreateLogin() {
    if (!loginTarget) return
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ employeeId: loginTarget.id, role: loginRole }),
    })
    const json = await res.json()

    if (!res.ok) {
      alert('Error: ' + json.error)
      setCreating(false)
      return
    }

    setResult(json)
    setEmployees(prev => prev.map(e => e.id === loginTarget.id ? { ...e, profile_id: 'pending' } : e))
    setCreating(false)
  }

  function closeLoginModal() {
    setLoginTarget(null)
    setResult(null)
    setLoginRole('agent')
    setCopied(false)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-white border border-[#E2E8F4] rounded-xl px-3 py-2.5">
            <Search size={16} className="text-[#9AAAC8]" />
            <input className="flex-1 text-sm outline-none text-[#0D1B3E] placeholder:text-[#9AAAC8] bg-transparent"
              placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowAdd(true)}
            className="bg-[#1A3A6B] text-white rounded-xl px-3 flex items-center gap-1 text-xs font-bold">
            <Plus size={16}/> Add
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {STATUS_FILTERS.map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filter === s.key
                  ? 'bg-[#1A3A6B] text-white border-[#1A3A6B]'
                  : 'bg-white text-[#4A5880] border-[#E2E8F4]'
              }`}>
              {s.label}
              {s.key !== 'all' && (
                <span className="ml-1 opacity-70">({employees.filter(e => e.status === s.key).length})</span>
              )}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#9AAAC8] font-medium mb-2 px-1">
          {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-[#9AAAC8]">No employees found.</p>
              <button onClick={() => setShowAdd(true)}
                className="mt-3 text-xs text-[#1F4FA8] font-semibold">+ Add your first employee</button>
            </div>
          )}
          {filtered.map((emp, i) => {
            const badge = STATUS_BADGE[emp.status] ?? STATUS_BADGE.active
            const ci    = i % BG.length
            const hasLogin = !!emp.profile_id
            return (
              <div key={emp.id}
                className="w-full bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: BG[ci], color: TC[ci] }}>
                  {initials(emp.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0D1B3E] truncate">{emp.full_name}</div>
                  <div className="text-xs text-[#9AAAC8] truncate mt-0.5">
                    {emp.job_title ?? 'No title'}
                    {emp.department && ` · ${emp.department}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: badge.bg, color: badge.text }}>
                    {badge.label}
                  </span>
                  {hasLogin ? (
                    <span className="text-[10px] text-[#166534] font-semibold">Has login</span>
                  ) : (
                    <button onClick={() => setLoginTarget(emp)}
                      className="text-[10px] font-bold text-[#1F4FA8] flex items-center gap-1">
                      <KeyRound size={11}/> Create Login
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAdd && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Add New Employee</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              {[
                { label:'Full Name *', key:'full_name', type:'text'  },
                { label:'Email *',     key:'email',     type:'email' },
                { label:'Phone',       key:'phone',     type:'tel'   },
                { label:'Job Title',   key:'job_title', type:'text'  },
                { label:'Salary ($)',  key:'salary',    type:'number'},
                { label:'Hire Date',   key:'hire_date', type:'date'  },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.key === 'full_name' || f.key === 'email'}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]"
                  />
                </div>
              ))}
              <p className="text-[11px] text-[#9AAAC8] -mt-1.5">Email is required so a login can be created for this person later.</p>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Department</label>
                <select value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Status</label>
                <select value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {STATUS_FILTERS.filter(s => s.key !== 'all').map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#1A3A6B] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin"/>}
                Save Employee
              </button>
            </form>
          </div>
        </div>
      )}

      {loginTarget && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Create Login</h3>
              <button onClick={closeLoginModal} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>

            {!result ? (
              <>
                <p className="text-sm text-[#4A5880] mb-4">
                  This creates a login for <span className="font-semibold">{loginTarget.full_name}</span> using their email
                  ({loginTarget.email}), and generates a temporary password.
                </p>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">System Role</label>
                <select value={loginRole} onChange={e => setLoginRole(e.target.value)}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE] mb-4">
                  {LOGIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button onClick={handleCreateLogin} disabled={creating}
                  className="w-full bg-[#1A3A6B] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {creating && <Loader2 size={16} className="animate-spin"/>}
                  Create Login
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-[#4A5880] mb-4">
                  Login created. Share these credentials with <span className="font-semibold">{loginTarget.full_name}</span> — this password won't be shown again.
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
                  className="w-full bg-white border border-[#E2E8F4] text-[#1A3A6B] font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 mb-2">
                  {copied ? <Check size={15}/> : <Copy size={15}/>}
                  {copied ? 'Copied!' : 'Copy credentials'}
                </button>
                <button onClick={closeLoginModal}
                  className="w-full bg-[#1A3A6B] text-white font-bold py-3.5 rounded-xl text-sm">
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