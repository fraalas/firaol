'use client'
import { useState } from 'react'
import { Search, Plus, Loader2, X, FileSpreadsheet, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getEATDateString, formatEATTime, eatDateTimeToISO } from '@/lib/timezone'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const STATUS_FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'present',  label: 'Present' },
  { key: 'absent',   label: 'Absent' },
  { key: 'late',     label: 'Late' },
  { key: 'half_day', label: 'Half Day' },
]

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  present:  { bg: '#F0FDF4', text: '#166534', label: 'Present' },
  absent:   { bg: '#FEF2F2', text: '#991B1B', label: 'Absent' },
  late:     { bg: '#FFFBEB', text: '#92400E', label: 'Late' },
  half_day: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Half Day' },
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const BG = ['#EFF6FF','#F0FDF4','#F0FDFA','#FFFBEB','#FAF5FF','#FEF2F2']
const TC = ['#1D4ED8','#166534','#0F766E','#92400E','#6B21A8','#991B1B']

interface Employee { id: string; full_name: string }
interface Props { records: any[]; employees: Employee[]; companyId: string }

export function AttendanceClient({ records: initial, employees, companyId }: Props) {
  const supabase = createClient()
  const [records, setRecords] = useState(initial)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({
    employee_id: employees[0]?.id ?? '',
    date: getEATDateString(),
    check_in: '', check_out: '', status: 'present', notes: '',
  })

  const empMap = Object.fromEntries(employees.map(e => [e.id, e.full_name]))

  const filtered = records.filter(r => {
    const name = empMap[r.employee_id] ?? ''
    const matchStatus = filter === 'all' || r.status === filter
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase.from('attendance').insert({
      company_id:  companyId,
      employee_id: form.employee_id,
      date:        form.date,
      check_in:    form.check_in ? eatDateTimeToISO(form.date, form.check_in) : null,
      check_out:   form.check_out ? eatDateTimeToISO(form.date, form.check_out) : null,
      status:      form.status,
      notes:       form.notes || null,
    }).select().single()

    if (error) {
      alert('Error: ' + error.message)
      setSaving(false)
      return
    }

    if (data) {
      setRecords(prev => [data, ...prev])
      setShowAdd(false)
      setForm({ employee_id: employees[0]?.id ?? '', date: getEATDateString(), check_in: '', check_out: '', status: 'present', notes: '' })
    }
    setSaving(false)
  }

  // ── Export to Excel ────────────────────────────────────────────────────────

  function handleExportExcel() {
    const rows = filtered.map(r => ({
      'Employee':   empMap[r.employee_id] ?? 'Unknown',
      'Date':       r.date,
      'Check In':   r.check_in ? formatEATTime(r.check_in) : '',
      'Check Out':  r.check_out ? formatEATTime(r.check_out) : '',
      'Work Hours': r.work_hours ?? '',
      'Status':     STATUS_BADGE[r.status]?.label ?? r.status,
      'Notes':      r.notes ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 24 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
    const dateStr = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `Sanchos_Attendance_${dateStr}.xlsx`)
  }

  // ── Export to PDF ──────────────────────────────────────────────────────────

  function handleExportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    doc.setFontSize(16)
    doc.setTextColor(7, 82, 144) // #075290
    doc.text('Sanchos Real Estate — Attendance Report', 14, 16)
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`Generated ${dateStr}  ·  ${filtered.length} records`, 14, 22)

    autoTable(doc, {
      startY: 28,
      head: [['Employee', 'Date', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Notes']],
      body: filtered.map(r => [
        empMap[r.employee_id] ?? 'Unknown',
        r.date,
        r.check_in ? formatEATTime(r.check_in) : '',
        r.check_out ? formatEATTime(r.check_out) : '',
        r.work_hours ? `${r.work_hours}h` : '',
        STATUS_BADGE[r.status]?.label ?? r.status,
        r.notes ?? '',
      ]),
      headStyles: { fillColor: [7, 82, 144], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 249, 253] },
      styles: { fontSize: 9, cellPadding: 3 },
    })

    const dateFile = new Date().toISOString().slice(0, 10)
    doc.save(`Sanchos_Attendance_${dateFile}.pdf`)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-white border border-[#E2E8F4] rounded-xl px-3 py-2.5">
            <Search size={16} className="text-[#9AAAC8]" />
            <input className="flex-1 text-sm outline-none text-[#0D1B3E] placeholder:text-[#9AAAC8] bg-transparent"
              placeholder="Search by employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowAdd(true)}
            disabled={employees.length === 0}
            className="bg-[#075290] text-white rounded-xl px-3 flex items-center gap-1 text-xs font-bold disabled:opacity-40">
            <Plus size={16}/> Add
          </button>
        </div>

        {/* Export toolbar */}
        <div className="flex gap-2 mb-3">
          <button onClick={handleExportExcel}
            className="flex-1 bg-white border border-[#E2E8F4] rounded-xl px-2 py-2 text-xs font-semibold text-[#4A5880] flex items-center justify-center gap-1.5">
            <FileSpreadsheet size={14}/> Excel
          </button>
          <button onClick={handleExportPDF}
            className="flex-1 bg-white border border-[#E2E8F4] rounded-xl px-2 py-2 text-xs font-semibold text-[#4A5880] flex items-center justify-center gap-1.5">
            <FileText size={14}/> PDF
          </button>
        </div>

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
                <span className="ml-1 opacity-70">({records.filter(r => r.status === s.key).length})</span>
              )}
            </button>
          ))}
        </div>

        {employees.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#9AAAC8]">Add employees first before logging attendance.</p>
          </div>
        )}

        <div className="text-xs text-[#9AAAC8] font-medium mb-2 px-1">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && employees.length > 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-[#9AAAC8]">No attendance records found.</p>
              <button onClick={() => setShowAdd(true)}
                className="mt-3 text-xs text-[#1F4FA8] font-semibold">+ Log attendance</button>
            </div>
          )}
          {filtered.map((r, i) => {
            const name  = empMap[r.employee_id] ?? 'Unknown'
            const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.present
            const ci    = i % BG.length
            return (
              <div key={r.id}
                className="w-full bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: BG[ci], color: TC[ci] }}>
                  {initials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0D1B3E] truncate">{name}</div>
                  <div className="text-xs text-[#9AAAC8] truncate mt-0.5">
                    {r.date} · {formatEATTime(r.check_in)} – {formatEATTime(r.check_out)}
                    {r.work_hours && ` · ${r.work_hours}h`}
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: badge.bg, color: badge.text }}>
                  {badge.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {showAdd && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0D1B3E] text-base">Log Attendance</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Employee *</label>
                <select required value={form.employee_id}
                  onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]">
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Date *</label>
                <input type="date" required value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Check In (EAT)</label>
                  <input type="time" value={form.check_in}
                    onChange={e => setForm(p => ({ ...p, check_in: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Check Out (EAT)</label>
                  <input type="time" value={form.check_out}
                    onChange={e => setForm(p => ({ ...p, check_out: e.target.value }))}
                    className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]" />
                </div>
              </div>
              <p className="text-[11px] text-[#9AAAC8] -mt-1.5">Times are in East Africa Time (UTC+3). Work hours calculate automatically.</p>
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
              <div>
                <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Notes</label>
                <input type="text" value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE]" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin"/>}
                Save Record
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}