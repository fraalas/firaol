'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Bell, LogOut, ChevronRight, Loader2, Check, Shield, BarChart2, Download, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { initials } from '@/lib/utils'
import { ROLE_TITLES, CAN_EDIT_ORG_FIELDS } from '@/lib/permissions'
import { TwoFactorSection } from './TwoFactorSection'
import type { Profile } from '@/types/database'

interface Props {
  profile: (Profile & { department?: string; position?: string; address?: string }) | null
  email: string
  companyName: string
  viewerRole: string
  leadsCount: number
  closedDeals: number
}

export function ProfileClient({ profile, email, companyName, viewerRole, leadsCount, closedDeals }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [notifs, setNotifs] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [form, setForm] = useState({
    full_name:  profile?.full_name ?? '',
    phone:      profile?.phone ?? '',
    department: profile?.department ?? '',
    position:   profile?.position ?? '',
    address:    profile?.address ?? '',
  })

  const roleBadge: Record<string, { bg: string; text: string }> = {
    ceo:             { bg: '#FEF2F2', text: '#991B1B' },
    general_manager: { bg: '#FEF2F2', text: '#991B1B' },
    hr:              { bg: '#F0FDF4', text: '#166534' },
    sales_manager:   { bg: '#EFF6FF', text: '#1D4ED8' },
    agent:           { bg: '#F0FDFA', text: '#0F766E' },
    staff:           { bg: '#F5F7FB', text: '#4A5880' },
  }
  const rb = roleBadge[profile?.role ?? 'agent'] ?? { bg: '#EFF6FF', text: '#1D4ED8' }
  const roleTitle = ROLE_TITLES[profile?.role ?? ''] ?? profile?.role
  const isAdmin = profile?.role === 'ceo' || profile?.role === 'general_manager'
  const canEditOrgFields = CAN_EDIT_ORG_FIELDS.includes(viewerRole as any)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      alert('Error uploading photo: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)

    if (updateError) {
      alert('Error saving photo: ' + updateError.message)
    } else {
      setAvatarUrl(publicUrl)
    }
    setUploading(false)
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    const payload: any = { full_name: form.full_name, phone: form.phone, address: form.address }
    if (canEditOrgFields) {
      payload.department = form.department
      payload.position   = form.position
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id)
    if (error) alert('Error: ' + error.message)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Hero */}
      <div className="bg-[#075290] px-4 py-7 flex flex-col items-center">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-[#2E5FA8] border-4 border-white/30 flex items-center justify-center text-white text-2xl font-extrabold overflow-hidden">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : initials(profile?.full_name ?? 'User')}
          </div>
          <button onClick={() => fileInput.current?.click()} disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md disabled:opacity-60">
            {uploading ? <Loader2 size={13} className="animate-spin text-[#075290]"/> : <Camera size={13} className="text-[#075290]"/>}
          </button>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div className="text-white font-bold text-lg">{profile?.full_name}</div>
        <div className="text-white/70 text-xs mt-0.5">{roleTitle}</div>
        <div className="text-white/50 text-xs mt-1">{companyName}</div>
        {(form.department || form.position) && (
          <div className="text-white/50 text-xs mt-0.5">
            {[form.position, form.department].filter(Boolean).join(' · ')}
          </div>
        )}
        <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold capitalize"
          style={{ background: rb.bg, color: rb.text }}>{profile?.role?.replace('_', ' ')}</span>
        <div className="grid grid-cols-2 gap-3 mt-4 w-full">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <div className="text-2xl font-extrabold text-white">{leadsCount}</div>
            <div className="text-white/50 text-xs mt-0.5">My Leads</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <div className="text-2xl font-extrabold text-white">{closedDeals}</div>
            <div className="text-white/50 text-xs mt-0.5">Closed Deals</div>
          </div>
        </div>
      </div>

      <div className="bg-[#F5F7FB] -mt-3 rounded-t-3xl px-4 pt-5 space-y-4">

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-[#E2E8F4] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F4] flex items-center justify-between">
            <span className="text-xs font-bold text-[#9AAAC8] uppercase tracking-wider">Personal Info</span>
            <button onClick={handleSave} disabled={saving}
              className="text-xs font-bold flex items-center gap-1"
              style={{ color: saved ? '#22C55E' : '#1F4FA8' }}>
              {saving ? <Loader2 size={12} className="animate-spin"/> : saved ? <Check size={12}/> : null}
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Full Name', key: 'full_name', type: 'text' },
              { label: 'Phone',     key: 'phone',     type: 'tel'  },
              { label: 'Address',   key: 'address',   type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-[#9AAAC8] mb-1 block">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-[#E2E8F4] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#075290] bg-[#FAFBFE]"/>
              </div>
            ))}
            <div>
              <label className="text-xs text-[#9AAAC8] mb-1 block">Email</label>
              <div className="border border-[#E2E8F4] rounded-xl px-4 py-2.5 text-sm text-[#9AAAC8] bg-[#F5F7FB]">{email}</div>
            </div>
          </div>
        </div>

        {/* Department / Position */}
        <div className="bg-white rounded-2xl border border-[#E2E8F4] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F4]">
            <span className="text-xs font-bold text-[#9AAAC8] uppercase tracking-wider">Organization</span>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Department', key: 'department' },
              { label: 'Position',   key: 'position'   },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-[#9AAAC8] mb-1 block">{f.label}</label>
                <input type="text" value={(form as any)[f.key]}
                  disabled={!canEditOrgFields}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className={`w-full border border-[#E2E8F4] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#075290] ${
                    canEditOrgFields ? 'bg-[#FAFBFE]' : 'bg-[#F5F7FB] text-[#9AAAC8]'
                  }`}/>
              </div>
            ))}
            {!canEditOrgFields && (
              <p className="text-[11px] text-[#9AAAC8]">Only HR, CEO, or General Manager can change these.</p>
            )}
          </div>
        </div>

        <TwoFactorSection />

        {/* Admin links */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-[#E2E8F4] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E8F4]">
              <span className="text-xs font-bold text-[#9AAAC8] uppercase tracking-wider">Admin</span>
            </div>
            {[
              { icon: Shield,   bg:'#FEF2F2', color:'#991B1B', href:'/admin',   label:'Admin Panel',   sub:'Team overview'    },
              { icon: BarChart2,bg:'#EFF6FF', color:'#1D4ED8', href:'/reports', label:'Reports',        sub:'Analytics'        },
              { icon: Download, bg:'#F0FDF4', color:'#166534', href:'/export',  label:'Export Data',    sub:'Excel & PDF'      },
            ].map(item => (
              <button key={item.href} onClick={() => router.push(item.href)}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2E8F4] w-full last:border-0 hover:bg-[#FAFBFE] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                  <item.icon size={17} style={{ color: item.color }}/>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-[#0D1B3E]">{item.label}</div>
                  <div className="text-xs text-[#9AAAC8]">{item.sub}</div>
                </div>
                <ChevronRight size={15} className="text-[#9AAAC8]"/>
              </button>
            ))}
          </div>
        )}

        {!isAdmin && (
          <button onClick={() => router.push('/export')}
            className="w-full bg-white rounded-2xl border border-[#E2E8F4] p-4 flex items-center gap-3 hover:bg-[#FAFBFE] text-left">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F0FDF4]">
              <Download size={17} className="text-[#166634]"/>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#0D1B3E]">Export My Leads</div>
              <div className="text-xs text-[#9AAAC8]">Excel & PDF</div>
            </div>
            <ChevronRight size={15} className="text-[#9AAAC8]"/>
          </button>
        )}

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-[#E2E8F4] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F4]">
            <span className="text-xs font-bold text-[#9AAAC8] uppercase tracking-wider">Settings</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2E8F4]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FFFBEB]">
              <Bell size={17} className="text-[#92400E]"/>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#0D1B3E]">Notifications</div>
              <div className="text-xs text-[#9AAAC8]">Lead alerts & reminders</div>
            </div>
            <button onClick={() => setNotifs(!notifs)}
              className="w-10 h-[22px] rounded-full relative flex-shrink-0 transition-colors"
              style={{ background: notifs ? '#075290' : '#E2E8F4' }}>
              <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all ${notifs ? 'right-[3px]' : 'left-[3px]'}`}/>
            </button>
          </div>
          <button onClick={() => router.push('/auth/forgot-password')}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2E8F4] w-full hover:bg-[#FAFBFE]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EFF6FF]">
              <Lock size={17} className="text-[#1D4ED8]"/>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-[#0D1B3E]">Change Password</div>
            </div>
            <ChevronRight size={15} className="text-[#9AAAC8]"/>
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-red-50 transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FEF2F2]">
              <LogOut size={17} className="text-red-500"/>
            </div>
            <div className="text-sm font-medium text-red-500 text-left">Sign out</div>
          </button>
        </div>

        <div className="text-center text-xs text-[#9AAAC8] pb-4">
          Sanchos Real Estate CRM v2.0.0
        </div>
      </div>
    </div>
  )
}