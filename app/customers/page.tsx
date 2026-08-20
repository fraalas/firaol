'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { CustomersClient } from './CustomersClient'
import { isFullAccess } from '@/lib/permissions'

export default function CustomersPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [userId,    setUserId]    = useState('')
  const [isAdmin,   setIsAdmin]   = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles').select('role, company_id').eq('id', user.id).single()
      const cid = profile?.company_id ?? ''
      setCompanyId(cid)
      const admin = isFullAccess(profile?.role) || profile?.role === 'sales_manager'
      setIsAdmin(admin)

      let query = supabase.from('customers').select('*').order('created_at', { ascending: false })
      if (!admin) query = query.eq('assigned_agent_id', user.id)
      const { data: customerData } = await query
      setCustomers(customerData ?? [])

      const { data: propertyData } = await supabase
        .from('properties').select('id, title').eq('company_id', cid).order('title')
      setProperties(propertyData ?? [])

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
    <AppLayout title="Customers" subtitle={`${customers.length} total`}>
      <CustomersClient
        customers={customers}
        properties={properties}
        companyId={companyId}
        userId={userId}
      />
    </AppLayout>
  )
}