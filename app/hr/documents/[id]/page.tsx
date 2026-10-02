'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Download, Archive, ArchiveRestore, Loader2,
  FileText, MapPin, Calendar, User as UserIcon, Clock, QrCode,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { hasPermission, isFullAccess } from '@/lib/permissions'
import { formatDate, formatDateTime } from '@/lib/utils'

// Rendered as a plain <img> via a public QR-image service rather than any
// client-side JS library — both the CDN-script and the bundled-npm-package
// approaches failed silently in some mobile/in-app browsers (e.g. Telegram's
// built-in browser) with no error visible to the end user. A plain image
// request behaves the same way everywhere, same as any other photo in the
// app. Only the document's URL (a UUID path, no personal data) is sent to
// generate the image.
function qrImageUrl(documentUrl: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(documentUrl)}`
}

export default function DocumentDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [doc, setDoc] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [previewUrl, setPreviewUrl] = useState('')
  const [qrLoaded, setQrLoaded] = useState(false)
  const [qrFailed, setQrFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const loggedView = useRef(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const authorized = isFullAccess(profile?.role) || hasPermission(profile?.role, 'hr')
      if (!authorized) { router.replace('/dashboard'); return }

      // get_document() applies the same access rules whether this page was
      // reached by clicking a row or by scanning a QR code — an empty
      // result here means "not found or you don't have access", and we
      // deliberately don't distinguish the two so a scan can't be used to
      // probe which document IDs exist.
      const { data, error: err } = await supabase.schema('hr_docs').rpc('get_document', { p_document_id: id })
      if (err || !data || data.length === 0) { setNotFound(true); setLoading(false); return }

      const record = data[0]
      setDoc(record)

      const { data: signed } = await supabase.storage.from('hr-documents')
        .createSignedUrl(record.storage_path, 600)
      if (signed) setPreviewUrl(signed.signedUrl)

      const { data: hist } = await supabase.schema('hr_docs').rpc('get_document_history', { p_document_id: id })
      setHistory(hist ?? [])

      if (!loggedView.current) {
        loggedView.current = true
        await supabase.schema('hr_docs').rpc('log_event', { p_document_id: id, p_action: 'viewed' })
      }

      setLoading(false)
      await supabase.schema('hr_docs').rpc('log_event', { p_document_id: id, p_action: 'qr_generated' })
    }
    load()
  }, [id])

  const documentUrl = typeof window !== 'undefined' ? `${window.location.origin}/hr/documents/${id}` : ''

  async function handleDownload() {
    if (!doc || !previewUrl) return
    await supabase.schema('hr_docs').rpc('log_event', { p_document_id: id, p_action: 'downloaded' })
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = doc.file_name
    a.click()
  }

  async function toggleArchive() {
    if (!doc) return
    setBusy(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const nextArchived = !doc.is_archived

    const { error: err } = await supabase.schema('hr_docs').from('documents').update({
      is_archived: nextArchived,
      archived_at: nextArchived ? new Date().toISOString() : null,
      archived_by: nextArchived ? (user?.id ?? null) : null,
    }).eq('id', id)

    if (err) { setError(err.message); setBusy(false); return }

    setDoc({ ...doc, is_archived: nextArchived })
    const { data: hist } = await supabase.schema('hr_docs').rpc('get_document_history', { p_document_id: id })
    setHistory(hist ?? [])
    setBusy(false)
  }

  async function downloadQr() {
    if (!doc || !documentUrl) return
    try {
      // Fetch as a blob so the browser saves it as a file rather than
      // navigating to the image — works regardless of this being a
      // cross-origin image URL.
      const res = await fetch(qrImageUrl(documentUrl))
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${doc.document_code}-qr.png`
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      // Fallback for browsers that block the fetch (e.g. some in-app
      // browsers): open the image directly so the user can long-press
      // and save it manually.
      window.open(qrImageUrl(documentUrl), '_blank')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB]">
      <div className="w-10 h-10 border-4 border-[#075290] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (notFound) return (
    <AppLayout title="Document">
      <div className="p-6 text-center">
        <FileText size={40} className="text-[#9AAAC8] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#0D1B3E] mb-1">Not found, or you don't have access</p>
        <p className="text-xs text-[#9AAAC8] mb-4">This document may not exist, or belongs to a different branch/company than your account.</p>
        <button onClick={() => router.push('/hr/documents')}
          className="text-xs font-bold text-[#075290]">← Back to Document Archive</button>
      </div>
    </AppLayout>
  )

  const isImage = doc.file_type?.startsWith('image/')
  const isPdf   = doc.file_type === 'application/pdf'

  return (
    <AppLayout title={doc.title} subtitle={doc.document_code}>
      <div className="p-4 pb-10 max-w-2xl mx-auto space-y-4">
        <button onClick={() => router.push('/hr/documents')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#4A5880]">
          <ArrowLeft size={14} /> Back to Archive
        </button>

        {error && <div className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>}

        {doc.is_archived && (
          <div className="text-xs font-semibold text-[#334155] bg-[#F1F5F9] rounded-xl px-3 py-2">
            This document is archived.
          </div>
        )}

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-[#E2E8F4] overflow-hidden">
          {isImage && previewUrl && (
            <img src={previewUrl} alt={doc.title} className="w-full max-h-[420px] object-contain bg-[#F5F7FB]" />
          )}
          {isPdf && previewUrl && (
            <iframe src={previewUrl} className="w-full h-[420px]" title={doc.title} />
          )}
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center justify-center py-10 text-[#9AAAC8]">
              <FileText size={32} className="mb-2" />
              <span className="text-xs">No inline preview for this file type</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleDownload}
            className="flex-1 bg-[#075290] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm">
            <Download size={16} /> Download
          </button>
          <button onClick={toggleArchive} disabled={busy}
            className="flex-1 border border-[#E2E8F4] text-[#4A5880] font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : doc.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            {doc.is_archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4 space-y-2.5">
          <Row icon={FileText} label="Type" value={doc.doc_type} />
          {doc.employee_name && <Row icon={UserIcon} label="Employee" value={doc.employee_name} />}
          {doc.branch_name && <Row icon={MapPin} label="Branch" value={doc.branch_name} />}
          {doc.document_date && <Row icon={Calendar} label="Document Date" value={formatDate(doc.document_date)} />}
          {doc.physical_location && <Row icon={MapPin} label="Physical Location" value={doc.physical_location} />}
          {doc.notes && <Row icon={FileText} label="Notes" value={doc.notes} />}
          <Row icon={Clock} label="Registered" value={formatDateTime(doc.created_at)} />
        </div>

        {/* QR code */}
        <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4 flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl bg-[#F5F7FB] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {documentUrl && !qrFailed ? (
              <img src={qrImageUrl(documentUrl)} alt="Document QR code" className="w-full h-full"
                onLoad={() => setQrLoaded(true)} onError={() => setQrFailed(true)} />
            ) : (
              <QrCode size={28} className="text-[#9AAAC8]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#0D1B3E]">Document QR Code</div>
            <div className="text-xs text-[#9AAAC8] mt-0.5">
              {qrFailed
                ? 'Could not load the QR image — check your connection and reopen this page.'
                : 'Scanning it opens this page, still protected by the same permission checks.'}
            </div>
            {qrLoaded && !qrFailed && (
              <button onClick={downloadQr} className="text-xs font-bold text-[#075290] mt-2">
                Download QR
              </button>
            )}
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
          <div className="text-sm font-semibold text-[#0D1B3E] mb-3">History</div>
          {history.length === 0 ? (
            <div className="text-xs text-[#9AAAC8]">No activity recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#4A5880] capitalize">{h.action.replace('_', ' ')}</span>
                  <span className="text-[#9AAAC8]">{formatDateTime(h.occurred_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-[#9AAAC8] mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-[#9AAAC8] uppercase tracking-wide">{label}</div>
        <div className="text-sm text-[#0D1B3E] break-words">{value}</div>
      </div>
    </div>
  )
}
