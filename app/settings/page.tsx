'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { hasPermission } from '@/lib/permissions'
import { SettingsClient } from './SettingsClient'

export default function SettingsPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [company, setCompany] = useState<any>(null)
  const [role,    setRole]    = useState('')
  const [loading, setLoading] = useState(true)
  const [denied,  setDenied]  = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role, company_id').eq('id', user.id).single()

      if (!profile || !hasPermission(profile.role, 'settings')) {
        setDenied(true)
        setLoading(false)
        return
      }

      setRole(profile.role)

      const { data: companyData } = await supabase
        .from('companies').select('*').eq('id', profile.company_id).single()
      setCompany(companyData)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F5F7FB]">
      <div className="w-10 h-10 border-4 border-[#075290] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (denied) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F5F7FB] px-6 text-center">
      <p className="text-sm font-semibold text-[#0D1B3E] mb-1">You don't have access to Settings.</p>
      <p className="text-xs text-[#9AAAC8] mb-4">Only CEO and General Manager roles can manage company settings.</p>
      <button onClick={() => router.push('/dashboard')}
        className="text-xs font-bold text-[#1F4FA8]">← Back to Dashboard</button>
    </div>
  )

  return (
    <AppLayout title="Settings" subtitle="Company profile & preferences">
      <SettingsClient company={company} />
    </AppLayout>
  )
}