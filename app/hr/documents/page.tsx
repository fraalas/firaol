'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { hasPermission, isFullAccess } from '@/lib/permissions'
import { DocumentsClient } from './DocumentsClient'

export default function DocumentsPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role, company_id').eq('id', user.id).single()

      // HR Document Archive is HR-tier only — same gate as Attendance and
      // Employees. Regular staff/agents are sent back to the dashboard.
      const authorized = isFullAccess(profile?.role) || hasPermission(profile?.role, 'hr')
      if (!authorized) { router.replace('/dashboard'); return }

      const cid = profile?.company_id ?? ''
      setCompanyId(cid)

      const [{ data: emps }, { data: docs, error: docsErr }] = await Promise.all([
        supabase.from('employees').select('id, full_name, branch_id').eq('company_id', cid).order('full_name'),
        supabase.schema('hr_docs').rpc('search_documents', {}),
      ])
      if (docsErr) console.error('Document search error:', docsErr.message)

      setEmployees(emps ?? [])
      setDocuments(docs ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB]">
      <div className="w-10 h-10 border-4 border-[#075290] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <AppLayout title="Document Archive" subtitle={`${documents.length} record${documents.length === 1 ? '' : 's'}`}>
      <DocumentsClient documents={documents} employees={employees} companyId={companyId} />
    </AppLayout>
  )
}
