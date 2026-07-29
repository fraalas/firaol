'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { MyAttendanceClient } from './MyAttendanceClient'
import { getEATDateString } from '@/lib/timezone'

export default function MyAttendancePage() {
  const supabase = createClient()
  const router   = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [history,  setHistory]  = useState<any[]>([])
  const [today,    setToday]    = useState<any>(null)
  const [companyId, setCompanyId] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('role, company_id').eq('id', user.id).single()
    const cid = profile?.company_id ?? ''
    setCompanyId(cid)

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

    if (!emp) { setNotFound(true); setLoading(false); return }
    setEmployee(emp)

    const todayStr = getEATDateString()
    const { data: records } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', emp.id)
      .order('date', { ascending: false })
      .limit(15)

    setHistory(records ?? [])
    setToday((records ?? []).find(r => r.date === todayStr) ?? null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB]">
      <div className="w-10 h-10 border-4 border-[#075290] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <AppLayout title="My Attendance" subtitle={employee ? employee.full_name : undefined}>
      {notFound ? (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <p className="text-sm text-[#9AAAC8]">
            No employee record is linked to your account yet.<br/>Contact HR to get set up.
          </p>
        </div>
      ) : (
        <MyAttendanceClient
          employee={employee}
          companyId={companyId}
          today={today}
          history={history}
          onChange={load}
        />
      )}
    </AppLayout>
  )
}