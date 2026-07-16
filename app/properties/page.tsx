'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { PropertiesClient } from './PropertiesClient'

export default function PropertiesPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [properties, setProperties] = useState<any[]>([])
  const [agentId,    setAgentId]    = useState('')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }
      setAgentId(user.id)

      const { data } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
      setProperties(data ?? [])
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
    <AppLayout title="Properties" subtitle={`${properties.length} listings`}>
      <PropertiesClient properties={properties} agentId={agentId} />
    </AppLayout>
  )
}