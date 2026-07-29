'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { ReportsClient } from './ReportsClient'

export default function ReportsPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

      let leadsQ = supabase.from('leads').select('*')
      if (!isAdmin) leadsQ = leadsQ.eq('agent_id', user.id)
      const { data: leads } = await leadsQ

      const { data: properties } = await supabase.from('properties').select('*')
      const { data: activities } = await supabase
        .from('activities').select('*').eq('agent_id', user.id)

      const allLeads      = leads      ?? []
      const allProperties = properties ?? []
      const allActivities = activities ?? []

      const now       = new Date()
      const closed    = allLeads.filter((l: any) => l.stage === 'closed')
      const thisMonth = allLeads.filter((l: any) => {
        const d = new Date(l.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      const lastMonth = allLeads.filter((l: any) => {
        const d    = new Date(l.created_at)
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear()
      })

      const stats = {
        totalLeads:          allLeads.length,
        closedDeals:         closed.length,
        convRate:            allLeads.length ? Math.round(closed.length / allLeads.length * 100) : 0,
        totalRevenue:        closed.reduce((s: number, l: any) => s + (l.budget ?? 0), 0),
        thisMonthLeads:      thisMonth.length,
        lastMonthLeads:      lastMonth.length,
        totalProperties:     allProperties.length,
        availableProperties: allProperties.filter((p: any) => p.status === 'available').length,
        totalActivities:     allActivities.length,
        completedActivities: allActivities.filter((a: any) => a.completed).length,
      }

      const STAGES = ['new_lead','contacted','interested','property_visit','negotiation','closed','lost']
      const stageData = STAGES.map(s => ({
        stage: s,
        count: allLeads.filter((l: any) => l.stage === s).length,
      }))

      const SOURCES = ['referral','website','social','walk_in','cold_call','other']
      const sourceData = SOURCES.map(s => ({
        source: s,
        count: allLeads.filter((l: any) => l.source === s).length,
      })).filter((s: any) => s.count > 0)

      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        return {
          month: d.toLocaleString('default', { month: 'short' }),
          leads: allLeads.filter((l: any) => {
            const ld = new Date(l.created_at)
            return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear()
          }).length,
        }
      })

      const actData = allActivities.reduce((acc: any[], a: any) => {
        const existing = acc.find((x: any) => x.type === a.type)
        if (existing) { existing.total++; if (a.completed) existing.completed++ }
        else acc.push({ type: a.type, total: 1, completed: a.completed ? 1 : 0 })
        return acc
      }, [])

      setData({ stats, stageData, sourceData, monthlyData, actData })
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
    <AppLayout title="Reports">
      <ReportsClient
        stats={data.stats}
        stageData={data.stageData}
        sourceData={data.sourceData}
        monthlyData={data.monthlyData}
        actData={data.actData}
      />
    </AppLayout>
  )
}