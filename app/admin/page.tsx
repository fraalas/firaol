'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminClient } from './AdminClient'

export default function AdminPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [agents,     setAgents]     = useState<any[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'agent') { router.replace('/dashboard'); return }

      const { data: agentsData } = await supabase
        .from('profiles').select('*').order('created_at', { ascending: false })

      const { data: allLeads } = await supabase
        .from('leads').select('agent_id, stage')
      setTotalLeads(allLeads?.length ?? 0)

      const agentsWithStats = (agentsData ?? []).map((agent: any) => {
        const myLeads = (allLeads ?? []).filter((l: any) => l.agent_id === agent.id)
        return {
          ...agent,
          totalLeads:  myLeads.length,
          closedDeals: myLeads.filter((l: any) => l.stage === 'closed').length,
          activeLeads: myLeads.filter((l: any) => !['closed','lost'].includes(l.stage)).length,
          convRate:    myLeads.length
            ? Math.round(myLeads.filter((l: any) => l.stage === 'closed').length / myLeads.length * 100) : 0,
        }
      })
      setAgents(agentsWithStats)
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
    <AppLayout title="Admin Panel" subtitle="Team overview">
      <AdminClient agents={agents} totalLeads={totalLeads} />
    </AppLayout>
  )
}