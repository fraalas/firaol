'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { TeamClient } from './TeamClient'
import { hasPermission, isFullAccess } from '@/lib/permissions'

export default function SalesTeamPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [agents,    setAgents]    = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading,   setLoading]   = useState(true)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('role, company_id').eq('id', user.id).single()

    const authorized = isFullAccess(profile?.role) || hasPermission(profile?.role, 'manageTeam')
    if (!authorized) { router.replace('/dashboard'); return }

    const cid = profile?.company_id ?? ''
    setCompanyId(cid)

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, status, created_at')
      .eq('company_id', cid)
      .eq('role', 'agent')
      .order('created_at', { ascending: false })

    setAgents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB]">
      <div className="w-10 h-10 border-4 border-[#075290] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <AppLayout title="My Team" subtitle={`${agents.length} agents`}>
      <TeamClient agents={agents} companyId={companyId} onChange={load} />
    </AppLayout>
  )
}
