'use client'
import { useState, useRef } from 'react'
import { Search, Plus, Loader2, X, KeyRound, Copy, Check, Upload, FileSpreadsheet, FileText, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

// Maps flexible spreadsheet header names -> our actual DB columns
const IMPORT_FIELD_ALIASES: Record<string, string> = {
  'full name': 'full_name', 'name': 'full_name', 'employee name': 'full_name',
  'email': 'email', 'e-mail': 'email',
  'phone': 'phone', 'phone number': 'phone', 'mobile': 'phone',
  'department': 'department', 'dept': 'department',
  'job title': 'job_title', 'title': 'job_title', 'position': 'job_title',
  'salary': 'salary', 'monthly salary': 'salary',
  'hire date': 'hire_date', 'start date': 'hire_date', 'date hired': 'hire_date',
  'status': 'status',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const BG = ['#EFF6FF','#F0FDF4','#F0FDFA','#FFFBEB','#FAF5FF','#FEF2F2']
const TC = ['#1D4ED8','#166534','#0F766E','#92400E','#6B21A8','#991B1B']

const emptyForm = {
  full_name: '', email: '', phone: '', department: DEPARTMENTS[0],
  job_title: '', salary: '', hire_date: '', status: 'active',
}

interface Props { employees: any[]; companyId: string }

export function EmployeesClient({ employees: initial, companyId }: Props) {
  const supabase = createClient()
  const [employees, setEmployees] = useState(initial)
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [showAdd,   setShowAdd]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState(emptyForm)

  // Edit state
  const [editTarget, setEditTarget] = useState<any | null>(null)
  const [editForm,   setEditForm]   = useState(emptyForm)
  const [editSaving, setEditSaving] = useState(false)

  // Delete state
  const [deleteTarget,  setDeleteTarget]  = useState<any | null>(null)
  const [deleting,      setDeleting]      = useState(false)

  const [loginTarget, setLoginTarget] = useState<any | null>(null)
  const [loginRole,   setLoginRole]   = useState('agent')
  const [creating,    setCreating]    = useState(false)
  const [result,      setResult]      = useState<{ email: string; tempPassword: string } | null>(null)
  const [copied,      setCopied]      = useState(false)

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<{ added: number; skipped: number; errors: string[] } | null>(null)

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
      setForm(emptyForm)
    }
    setSaving(false)
  }

  // ── Edit ────────────────────────────────────────────────────────────────────

  function openEdit(emp: any) {
    setEditTarget(emp)
    setEditForm({
      full_name:  emp.full_name ?? '',
      email:      emp.email ?? '',
      phone:      emp.phone ?? '',
      department: emp.department ?? DEPARTMENTS[0],
      job_title:  emp.job_title ?? '',
      salary:     emp.salary?.toString() ?? '',
      hire_date:  emp.hire_date ?? '',
      status:     emp.status ?? 'active',
    })
  }

  function closeEdit() {
    setEditTarget(null)
    setEditForm(emptyForm)
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditSaving(true)

    const { data, error } = await supabase
      .from('employees')
      .update({
        full_name:  editForm.full_name,
        email:      editForm.email,
        phone:      editForm.phone || null,
        department: editForm.department,
        job_title:  editForm.job_title || null,
        salary:     editForm.salary ? parseFloat(editForm.salary) : 0,
        hire_date:  editForm.hire_date || null,
        status:     editForm.status,
      })
      .eq('id', editTarget.id)
      .select()
      .single()

    if (error) {
      alert('Error: ' + error.message)
      setEditSaving(false)
      return
    }

    if (data) {
      setEmployees(prev => prev.map(e => e.id === data.id ? data : e))
      closeEdit()
    }
    setEditSaving(false)
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('employees').delete().eq('id', deleteTarget.id)

    if (error) {
      alert('Error: ' + error.message)
      setDeleting(false)
      return
    }

    setEmployees(prev => prev.filter(e => e.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
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
      alert('Error: ' + JSON.stringify(json))
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

  // ── Import from Excel ──────────────────────────────────────────────────────

  function normalizeHeader(h: string) {
    return h.trim().toLowerCase()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportSummary(null)

    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      const toInsert: any[] = []
      const errors: string[] = []

      rows.forEach((row, idx) => {
        const mapped: Record<string, any> = {}
        for (const key of Object.keys(row)) {
          const normalized = normalizeHeader(key)
          const field = IMPORT_FIELD_ALIASES[normalized]
          if (field) mapped[field] = row[key]
        }

        if (!mapped.full_name || !mapped.email) {
          errors.push(`Row ${idx + 2}: missing Full Name or Email — skipped`)
          return
        }

        let hireDate: string | null = null
        if (mapped.hire_date) {
          const d = mapped.hire_date instanceof Date ? mapped.hire_date : new Date(mapped.hire_date)
          if (!isNaN(d.getTime())) hireDate = d.toISOString().slice(0, 10)
        }

        toInsert.push({
          full_name:  String(mapped.full_name).trim(),
          email:      String(mapped.email).trim(),
          phone:      mapped.phone ? String(mapped.phone).trim() : null,
          department: mapped.department ? String(mapped.department).trim() : DEPARTMENTS[0],
          job_title:  mapped.job_title ? String(mapped.job_title).trim() : null,
          salary:     mapped.salary ? parseFloat(mapped.salary) : 0,
          hire_date:  hireDate,
          status:     mapped.status ? String(mapped.status).trim().toLowerCase() : 'active',
          company_id: companyId,
        })
      })

      if (toInsert.length === 0) {
        setImportSummary({ added: 0, skipped: rows.length, errors: errors.length ? errors : ['No valid rows found. Check your column headers match: Full Name, Email, Phone, Department, Job Title, Salary, Hire Date, Status.'] })
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      const { data, error } = await supabase.from('employees').insert(toInsert).select()

      if (error) {
        setImportSummary({ added: 0, skipped: rows.length, errors: [error.message] })
      } else {
        setEmployees(prev => [...(data ?? []), ...prev])
        setImportSummary({ added: data?.length ?? 0, skipped: errors.length, errors })
      }
    } catch (err: any) {
      setImportSummary({ added: 0, skipped: 0, errors: ['Could not read file: ' + err.message] })
    }

    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Export to Excel ────────────────────────────────────────────────────────

  function handleExportExcel() {
    const rows = filtered.map(e => ({
      'Full Name':  e.full_name,
      'Email':      e.email ?? '',
      'Phone':      e.phone ?? '',
      'Department': e.department ?? '',
      'Job Title':  e.job_title ?? '',
      'Salary':     e.salary ?? 0,
      'Hire Date':  e.hire_date ?? '',
      'Status':     e.status ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 22 }, { wch: 26 }, { wch: 16 }, { wch: 14 },
      { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employees')
    const dateStr = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `Sanchos_Employees_${dateStr}.xlsx`)
  }

  // ── Export to PDF ──────────────────────────────────────────────────────────

  function handleExportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    doc.setFontSize(16)
    doc.setTextColor(26, 58, 107) // #075290
    doc.text('Sanchos Real Estate — Employee Report', 14, 16)
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`Generated ${dateStr}  ·  ${filtered.length} employees`, 14, 22)

    autoTable(doc, {
      startY: 28,
      head: [['Full Name', 'Email', 'Phone', 'Department', 'Job Title', 'Salary', 'Hire Date', 'Status']],
      body: filtered.map(e => [
        e.full_name,
        e.email ?? '',
        e.phone ?? '',
        e.department ?? '',
        e.job_title ?? '',
        e.salary ? `$${Number(e.salary).toLocaleString()}` : '$0',
        e.hire_date ?? '',
        e.status ?? '',
      ]),
      headStyles: { fillColor: [26, 58, 107], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 249, 253] },
      styles: { fontSize: 9, cellPadding: 3 },
    })

    const dateFile = new Date().toISOString().slice(0, 10)
    doc.save(`Sanchos_Employees_${dateFile}.pdf`)
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
            className="bg-[#075290] text-white rounded-xl px-3 flex items-center gap-1 text-xs font-bold">
            <Plus size={16}/> Add
          </button>
        </div>

        {/* Import / Export toolbar */}
        <div className="flex gap-2 mb-3">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="flex-1 bg-white border border-[#E2E8F4] rounded-xl px-2 py-2 text-xs font-semibold text-[#4A5880] flex items-center justify-center gap-1.5 disabled:opacity-60">
            {importing ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
            Import
          </button>
          <button onClick={handleExportExcel}
            className="flex-1 bg-white border border-[#E2E8F4] rounded-xl px-2 py-2 text-xs font-semibold text-[#4A5880] flex items-center justify-center gap-1.5">
            <FileSpreadsheet size={14}/> Excel
          </button>
          <button onClick={handleExportPDF}
            className="flex-1 bg-white border border-[#E2E8F4] rounded-xl px-2 py-2 text-xs font-semibold text-[#4A5880] flex items-center justify-center gap-1.5">
            <FileText size={14}/> PDF
          </button>
        </div>

        {importSummary && (
          <div className={`mb-3 rounded-xl border px-3 py-2.5 text-xs ${
            importSummary.added > 0 ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]' : 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {importSummary.added > 0 ? `Imported ${importSummary.added} employee(s).` : 'Import failed.'}
                {importSummary.skipped > 0 && ` ${importSummary.skipped} row(s) skipped.`}
              </span>
              <button onClick={() => setImportSummary(null)} className="ml-2"><X size={13}/></button>
            </div>
            {importSummary.errors.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 opacity-80">
                {importSummary.errors.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
                {importSummary.errors.length > 5 && <li>…and {importSummary.errors.length - 5} more</li>}
              </ul>
            )}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {STATUS_FILTERS.map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filter === s.key
                  ? 'bg-[#075290] text-white border-[#075290]'
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
                <button onClick={() => openEdit(emp)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                    style={{ background: BG[ci], color: TC[ci] }}>
                    {emp.profiles?.avatar_url
                      ? <img src={emp.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      : initials(emp.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#0D1B3E] truncate">{emp.full_name}</div>
                    <div className="text-xs text-[#9AAAC8] truncate mt-0.5">
                      {emp.job_title ?? 'No title'}
                      {emp.department && ` · ${emp.department}`}
                    </div>
                  </div>
                </button>
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
                <div className="flex flex-col gap-1.5 flex-shrink-0 ml-1">
                  <button onClick={() => openEdit(emp)} className="text-[#9AAAC8] hover:text-[#075290] p-1">
                    <Edit2 size={14}/>
                  </button>
                  <button onClick={() => setDeleteTarget(emp)} className="text-[#9AAAC8] hover:text-red-500 p-1">
                    <Trash2 size={14}/>
                  </button>
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
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]"
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
                className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin"/>}
                Save Employee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit sheet */}
      {editTarget && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Edit Employee</h3>
              <button onClick={closeEdit} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-3">
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
                    value={(editForm as any)[f.key]}
                    onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Department</label>
                <select value={editForm.department}
                  onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Status</label>
                <select value={editForm.status}
                  onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {STATUS_FILTERS.filter(s => s.key !== 'all').map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => { closeEdit(); setDeleteTarget(editTarget); }}
                  className="flex-1 border-2 border-red-200 text-red-500 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
                  <Trash2 size={15}/> Delete
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-[2] bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {editSaving && <Loader2 size={16} className="animate-spin"/>}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl p-6 w-full shadow-xl">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-[#0D1B3E] text-center mb-1">Delete Employee?</h3>
            <p className="text-sm text-[#9AAAC8] text-center mb-5">
              This will permanently delete <strong>{deleteTarget.full_name}</strong> from your employee records.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
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
                  className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
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
                  className="w-full bg-white border border-[#E2E8F4] text-[#075290] font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 mb-2">
                  {copied ? <Check size={15}/> : <Copy size={15}/>}
                  {copied ? 'Copied!' : 'Copy credentials'}
                </button>
                <button onClick={closeLoginModal}
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