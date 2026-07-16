'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { LeadsClient } from './LeadsClient'

export default function LeadsPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [leads,     setLeads]     = useState<any[]>([])
  const [agentId,   setAgentId]   = useState('')
  const [companyId, setCompanyId] = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }
      setAgentId(user.id)

      const { data: profile } = await supabase
        .from('profiles').select('role, company_id').eq('id', user.id).single()
      const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
      setCompanyId(profile?.company_id ?? '')

      let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
      if (!isAdmin) query = query.eq('agent_id', user.id)
      const { data } = await query
      setLeads(data ?? [])
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
    <AppLayout title="Leads" subtitle={`${leads.length} total`}>
      <LeadsClient leads={leads} agentId={agentId} companyId={companyId} />
    </AppLayout>
  )
}