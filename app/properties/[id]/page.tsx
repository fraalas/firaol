import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PropertyDetailClient } from './PropertyDetailClient'

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: property, error } = await supabase
    .from('properties').select('*').eq('id', params.id).single()
  if (error || !property) notFound()

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  return (
    <PropertyDetailClient
      property={property}
      currentUserId={user.id}
      userRole={profile?.role ?? 'agent'}
    />
  )
}
