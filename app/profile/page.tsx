'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProfileClient } from './ProfileClient'

export default function ProfilePage() {
  const supabase = createClient()
  const router   = useRouter()
  const [profile,     setProfile]     = useState<any>(null)
  const [email,       setEmail]       = useState('')
  const [companyName, setCompanyName] = useState('')
  const [myRole,      setMyRole]      = useState('agent')
  const [leadsCount,  setLeadsCount]  = useState(0)
  const [closedDeals, setClosedDeals] = useState(0)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }
      setEmail(user.email ?? '')

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, companies(name)')
        .eq('id', user.id).single()
      setProfile(profileData)
      setMyRole(profileData?.role ?? 'agent')
      setCompanyName((profileData as any)?.companies?.name ?? '')

      const { data: leads } = await supabase
        .from('leads').select('id, stage').eq('agent_id', user.id)
      setLeadsCount(leads?.length ?? 0)
      setClosedDeals(leads?.filter((l: any) => l.stage === 'closed').length ?? 0)
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
    <AppLayout title="Profile">
      <ProfileClient
        profile={profile}
        email={email}
        companyName={companyName}
        viewerRole={myRole}
        leadsCount={leadsCount}
        closedDeals={closedDeals}
      />
    </AppLayout>
  )
}