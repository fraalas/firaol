'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Loader2, X, FileText, Archive, FolderOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FormField, inputCls, selectCls } from '@/components/ui/FormField'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { initials, formatDate, AVATAR_BG, AVATAR_TC } from '@/lib/utils'

const DOC_TYPES = [
  'Contract', 'ID Card', 'Certificate', 'Warning Letter',
  'Payslip', 'Medical', 'Resume/CV', 'Other',
]

interface Props {
  documents: any[]
  employees: { id: string; full_name: string; branch_id: string | null }[]
  companyId: string
}

export function DocumentsClient({ documents: initial, employees, companyId }: Props) {
  const supabase = createClient()
  const router   = useRouter()

  const [documents, setDocuments] = useState(initial)
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [empFilter,  setEmpFilter]  = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [showUpload, setShowUpload] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [file,   setFile]   = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '', doc_type: DOC_TYPES[0], employee_id: '',
    document_date: '', physical_location: '', notes: '',
  })

  const empMap = Object.fromEntries(employees.map(e => [e.id, e.full_name]))

  async function runSearch(overrides: Partial<{ search: string; doc_type: string; employee_id: string; include_archived: boolean }> = {}) {
    setLoading(true)
    const { data, error: err } = await supabase.schema('hr_docs').rpc('search_documents', {
      p_search: (overrides.search ?? search) || null,
      p_doc_type: (overrides.doc_type ?? typeFilter) || null,
      p_employee_id: (overrides.employee_id ?? empFilter) || null,
      p_include_archived: overrides.include_archived ?? showArchived,
    })
    if (err) setError(err.message)
    else setDocuments(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ title: '', doc_type: DOC_TYPES[0], employee_id: '', document_date: '', physical_location: '', notes: '' })
    setFile(null)
    setError('')
  }

  async function handleUpload() {
    if (!file)          { setError('Choose a file to upload.'); return }
    if (!form.title)    { setError('Title is required.'); return }
    if (file.size > 25 * 1024 * 1024) { setError('Max file size is 25MB.'); return }

    setSaving(true)
    setError('')

    const branchId = form.employee_id ? (employees.find(e => e.id === form.employee_id)?.branch_id ?? null) : null
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${companyId}/${crypto.randomUUID()}-${safeName}`

    const { error: uploadErr } = await supabase.storage.from('hr-documents')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (uploadErr) { setError(uploadErr.message); setSaving(false); return }

    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertErr } = await supabase.schema('hr_docs').from('documents').insert({
      title: form.title,
      doc_type: form.doc_type,
      company_id: companyId,
      branch_id: branchId,
      employee_id: form.employee_id || null,
      document_date: form.document_date || null,
      physical_location: form.physical_location || null,
      notes: form.notes || null,
      storage_path: path,
      file_name: file.name,
      file_type: file.type,
      file_size_bytes: file.size,
      created_by: user?.id ?? null,
    })

    if (insertErr) {
      // Roll back the orphaned file so storage doesn't accumulate junk.
      await supabase.storage.from('hr-documents').remove([path])
      setError(insertErr.message)
      setSaving(false)
      return
    }

    setShowUpload(false)
    resetForm()
    await runSearch()
    setSaving(false)
  }

  return (
    <div className="p-4 pb-24">
      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AAAC8]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runSearch()}
          placeholder="Search by code, title, or employee…"
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E2E8F4] text-sm outline-none focus:border-[#075290] bg-white"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
        <select value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); runSearch({ doc_type: e.target.value }) }}
          className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full border border-[#E2E8F4] bg-white text-[#4A5880]">
          <option value="">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={empFilter}
          onChange={e => { setEmpFilter(e.target.value); runSearch({ employee_id: e.target.value }) }}
          className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full border border-[#E2E8F4] bg-white text-[#4A5880] max-w-[160px]">
          <option value="">All Employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>

        <button
          onClick={() => { const next = !showArchived; setShowArchived(next); runSearch({ include_archived: next }) }}
          className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full border transition-colors ${
            showArchived ? 'bg-[#0D1B3E] text-white border-[#0D1B3E]' : 'bg-white text-[#4A5880] border-[#E2E8F4]'
          }`}>
          <Archive size={12} className="inline mr-1 -mt-0.5" /> Include Archived
        </button>

        {loading && <Loader2 size={16} className="animate-spin text-[#9AAAC8] flex-shrink-0 self-center" />}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</div>
      )}

      {/* List */}
      {documents.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents found"
          subtitle="Try a different search, or register a new document."
          action={{ label: 'Register Document', onClick: () => setShowUpload(true) }} />
      ) : (
        <div className="space-y-2">
          {documents.map((d, i) => {
            const ci = i % AVATAR_BG.length
            return (
              <button key={d.id} onClick={() => router.push(`/hr/documents/${d.id}`)}
                className="w-full bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-center gap-3 text-left hover:border-[#075290] transition-colors">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: AVATAR_BG[ci], color: AVATAR_TC[ci] }}>
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0D1B3E] truncate">{d.title}</div>
                  <div className="text-xs text-[#9AAAC8] truncate mt-0.5">
                    {d.document_code} · {d.doc_type}
                    {d.employee_name && ` · ${d.employee_name}`}
                    {d.document_date && ` · ${formatDate(d.document_date)}`}
                  </div>
                </div>
                {d.is_archived && <Badge label="Archived" bg="#F1F5F9" color="#334155" size="sm" />}
              </button>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowUpload(true)}
        className="fixed bottom-24 right-5 md:bottom-8 w-14 h-14 rounded-full flex items-center justify-center z-40"
        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', boxShadow: '0 0 24px rgba(59,130,246,0.5)' }}>
        <Plus size={26} className="text-white" />
      </button>

      {/* Upload sheet */}
      <BottomSheet open={showUpload} onClose={() => { setShowUpload(false); resetForm() }} title="Register Document">
        <div className="space-y-3">
          {error && <div className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>}

          <FormField label="Title" required>
            <input className={inputCls} value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Employment Contract — Yared Getachew" />
          </FormField>

          <FormField label="Type" required>
            <select className={selectCls} value={form.doc_type}
              onChange={e => setForm({ ...form, doc_type: e.target.value })}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>

          <FormField label="Employee (optional)">
            <select className={selectCls} value={form.employee_id}
              onChange={e => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">— Not employee-specific —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </FormField>

          <FormField label="Document Date">
            <input type="date" className={inputCls} value={form.document_date}
              onChange={e => setForm({ ...form, document_date: e.target.value })} />
          </FormField>

          <FormField label="Physical Location">
            <input className={inputCls} value={form.physical_location}
              onChange={e => setForm({ ...form, physical_location: e.target.value })}
              placeholder="e.g. Cabinet A, Drawer 3, HQ" />
          </FormField>

          <FormField label="Notes">
            <textarea className={inputCls} rows={2} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>

          <FormField label="File (PDF or image)" required>
            <input type="file" accept="application/pdf,image/*"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-[#4A5880] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#EFF6FF] file:text-[#1D4ED8] file:font-semibold" />
            {file && <div className="text-[11px] text-[#9AAAC8] mt-1">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</div>}
          </FormField>

          <button onClick={handleUpload} disabled={saving}
            className="w-full bg-[#075290] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? 'Uploading…' : 'Register Document'}
          </button>
        </div>
      </BottomSheet>

      <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}
