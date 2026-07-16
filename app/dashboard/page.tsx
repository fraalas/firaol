'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardClient } from './DashboardClient'
import { AppLayout } from '@/components/layout/AppLayout'
import { hasPermission, isFullAccess } from '@/lib/permissions'
import { getEATDateString } from '@/lib/timezone'

const STAGES = ['new_lead','contacted','interested','property_visit','negotiation','closed','lost']

export default function DashboardPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [profile,   setProfile]   = useState<any>(null)
  const [leads,     setLeads]     = useState<any[]>([])
  const [hrStats,   setHrStats]   = useState({ employeeCount: 0, presentToday: 0, pendingLeave: 0 })
  const [canSeeHR,  setCanSeeHR]  = useState(false)
  const [canSeeCRM, setCanSeeCRM] = useState(false)
  const [isAdmin,   setIsAdmin]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  async function load() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) { router.replace('/auth/login'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      const role = profileData?.role
      const admin = isFullAccess(role)
      setIsAdmin(admin)

      const seeHR  = admin || hasPermission(role, 'hr')
      const seeCRM = admin || hasPermission(role, 'crm')
      setCanSeeHR(seeHR)
      setCanSeeCRM(seeCRM)

      if (seeCRM) {
        let leadsQuery = supabase.from('leads').select('*').order('created_at', { ascending: false })
        if (!admin) leadsQuery = leadsQuery.eq('agent_id', user.id)
        const { data: leadsData } = await leadsQuery
        setLeads(leadsData ?? [])
      }

      if (seeHR && profileData?.company_id) {
        const cid = profileData.company_id
        const todayStr = getEATDateString()
        const [{ count: empCount }, { count: presentCount }, { count: leaveCount }] = await Promise.all([
          supabase.from('employees').select('id', { count: 'exact', head: true }).eq('company_id', cid),
          supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('date', todayStr).not('check_in', 'is', null),
          supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('status', 'pending'),
        ])
        setHrStats({
          employeeCount: empCount ?? 0,
          presentToday:  presentCount ?? 0,
          pendingLeave:  leaveCount ?? 0,
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) router.replace('/auth/login')
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1A3A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-sm text-[#9AAAC8] font-medium">Loading your dashboard...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB] p-4">
      <div className="bg-white rounded-2xl border border-red-200 p-6 text-center max-w-sm w-full">
        <p className="text-red-500 text-sm font-medium mb-3">Error loading dashboard</p>
        <p className="text-[#9AAAC8] text-xs mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="bg-[#1A3A6B] text-white px-6 py-2 rounded-xl text-sm font-bold">Try Again</button>
      </div>
    </div>
  )

  const closedDeals = leads.filter((l: any) => l.stage === 'closed').length
  const stats = {
    totalLeads:     leads.length,
    newLeads:       leads.filter((l: any) => l.stage === 'new_lead').length,
    closedDeals,
    conversionRate: leads.length ? Math.round(closedDeals / leads.length * 100) : 0,
  }

  const pipelineData = STAGES.map(s => ({
    stage: s,
    label: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    count: leads.filter((l: any) => l.stage === s).length,
  }))

  return (
    <AppLayout title="Dashboard">
      <DashboardClient
        profile={profile}
        stats={stats}
        pipelineData={pipelineData}
        recentLeads={leads.slice(0, 5)}
        isAdmin={isAdmin}
        canSeeHR={canSeeHR}
        canSeeCRM={canSeeCRM}
        hrStats={hrStats}
        onRefresh={load}
      />
    </AppLayout>
  )
}