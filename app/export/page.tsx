'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { ExportClient } from './ExportClient'

export default function ExportPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [leads,      setLeads]      = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [agentName,  setAgentName]  = useState('')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setAgentName(profile?.full_name ?? 'Agent')

      const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

      let leadsQ = supabase.from('leads').select('*').order('created_at', { ascending: false })
      if (!isAdmin) leadsQ = leadsQ.eq('agent_id', user.id)
      const { data: leadsData } = await leadsQ
      setLeads(leadsData ?? [])

      let propsQ = supabase.from('properties').select('*').order('created_at', { ascending: false })
      if (!isAdmin) propsQ = propsQ.eq('agent_id', user.id)
      const { data: propsData } = await propsQ
      setProperties(propsData ?? [])

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
    <AppLayout title="Export Data">
      <ExportClient leads={leads} properties={properties} agentName={agentName} />
    </AppLayout>
  )
}