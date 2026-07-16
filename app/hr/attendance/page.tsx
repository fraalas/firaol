'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { AttendanceClient } from './AttendanceClient'
import { hasPermission, isFullAccess } from '@/lib/permissions'

export default function AttendancePage() {
  const supabase = createClient()
  const router   = useRouter()
  const [records,   setRecords]   = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role, company_id').eq('id', user.id).single()

      const authorized = isFullAccess(profile?.role) || hasPermission(profile?.role, 'hr')
      if (!authorized) { router.replace('/dashboard'); return }

      const cid = profile?.company_id ?? ''
      setCompanyId(cid)

      const [{ data: emps }, { data: att }] = await Promise.all([
        supabase.from('employees').select('id, full_name').eq('company_id', cid).order('full_name'),
        supabase.from('attendance').select('*').eq('company_id', cid).order('date', { ascending: false }),
      ])
      setEmployees(emps ?? [])
      setRecords(att ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB]">
      <div className="w-10 h-10 border-4 border-[#1A3A6B] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <AppLayout title="Attendance" subtitle={`${records.length} records`}>
      <AttendanceClient records={records} employees={employees} companyId={companyId} />
    </AppLayout>
  )
}