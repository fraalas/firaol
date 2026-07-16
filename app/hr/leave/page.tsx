'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { LeaveClient } from './LeaveClient'
import { hasPermission, isFullAccess } from '@/lib/permissions'

export default function LeavePage() {
  const supabase = createClient()
  const router   = useRouter()
  const [employee,  setEmployee]  = useState<any>(null)
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [allRequests, setAllRequests] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [canManage, setCanManage] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('role, company_id').eq('id', user.id).single()
    const cid = profile?.company_id ?? ''
    setCompanyId(cid)

    const manage = isFullAccess(profile?.role) || hasPermission(profile?.role, 'hr')
    setCanManage(manage)

    let { data: emp } = await supabase
      .from('employees').select('*').eq('profile_id', user.id).maybeSingle()

    if (!emp && user.email) {
      const { data: byEmail } = await supabase
        .from('employees').select('*').eq('email', user.email).eq('company_id', cid).maybeSingle()
      if (byEmail) {
        const { data: linked } = await supabase
          .from('employees').update({ profile_id: user.id }).eq('id', byEmail.id).select().single()
        emp = linked ?? byEmail
      }
    }

    if (!emp) {
      setNotFound(true)
      if (manage) {
        const { data: allEmps } = await supabase.from('employees').select('id, full_name').eq('company_id', cid).order('full_name')
        setEmployees(allEmps ?? [])
        const { data: all } = await supabase.from('leave_requests').select('*').eq('company_id', cid).order('created_at', { ascending: false })
        setAllRequests(all ?? [])
      }
      setLoading(false)
      return
    }
    setEmployee(emp)

    const { data: mine } = await supabase
      .from('leave_requests').select('*').eq('employee_id', emp.id).order('created_at', { ascending: false })
    setMyRequests(mine ?? [])

    if (manage) {
      const { data: allEmps } = await supabase.from('employees').select('id, full_name').eq('company_id', cid).order('full_name')
      setEmployees(allEmps ?? [])
      const { data: all } = await supabase
        .from('leave_requests').select('*').eq('company_id', cid).order('created_at', { ascending: false })
      setAllRequests(all ?? [])
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB]">
      <div className="w-10 h-10 border-4 border-[#1A3A6B] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <AppLayout title="Leave" subtitle={employee ? employee.full_name : undefined}>
      <LeaveClient
        employee={employee}
        companyId={companyId}
        myRequests={myRequests}
        allRequests={allRequests}
        employees={employees}
        canManage={canManage}
        notFoundEmployee={notFound}
        onChange={load}
      />
    </AppLayout>
  )
}