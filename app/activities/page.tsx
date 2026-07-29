'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { ActivitiesClient } from './ActivitiesClient'

export default function ActivitiesPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [activities, setActivities] = useState<any[]>([])
  const [agentId,    setAgentId]    = useState('')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }
      setAgentId(user.id)

      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('agent_id', user.id)
        .order('scheduled_at', { ascending: true })
      setActivities(data ?? [])
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
    <AppLayout title="Activities" subtitle="Upcoming tasks">
      <ActivitiesClient activities={activities} agentId={agentId} />
    </AppLayout>
  )
}