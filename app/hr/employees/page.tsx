'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { EmployeesClient } from './EmployeesClient'

export default function EmployeesPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [employees, setEmployees] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role, company_id').eq('id', user.id).single()
      setCompanyId(profile?.company_id ?? '')

      const { data } = await supabase
        .from('employees')
        .select('*, profiles:profile_id(avatar_url)')
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false })
      setEmployees(data ?? [])
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
    <AppLayout title="Employees" subtitle={`${employees.length} total`}>
      <EmployeesClient employees={employees} companyId={companyId} />
    </AppLayout>
  )
}