'use client'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Plus, CalendarDays, User,
  Home, BarChart2, Download, ShieldCheck, LogOut,
  UserCheck, Clock, CalendarOff, Wallet,
  TrendingUp, TrendingDown, BadgeDollarSign, Settings
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SanchosLogoSmall } from '@/components/ui/SanchosLogo'
import { getNavItems, ROLE_LABELS, ROLE_BADGE } from '@/lib/permissions'
import { useEffect, useState } from 'react'

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Users, CalendarDays, User,
  Home, BarChart2, Download, ShieldCheck,
  UserCheck, Clock, CalendarOff, Wallet,
  TrendingUp, TrendingDown, BadgeDollarSign, Settings,
}

const GROUP_LABELS: Record<string, string> = {
  main: '', CRM: 'CRM', HR: 'HR', Finance: 'Finance', System: 'System',
}

interface Props {
  children: React.ReactNode
  title?:   string
  subtitle?: string
}

export function AppLayout({ children, title, subtitle }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [role,    setRole]    = useState<string>('agent')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles').select('role, full_name, avatar_url').eq('id', user.id).single()
      if (data) { setRole(data.role); setProfile(data) }
    }
    loadRole()
  }, [])

  const navGroups = getNavItems(role)
  const flatItems = navGroups.flatMap(g => g.items)
  const mobileNav = flatItems.filter(n =>
    ['/dashboard','/leads','/activities','/profile'].includes(n.href)
  )

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.replace('/auth/login')
  }

  const rb = ROLE_BADGE[role] ?? { bg: '#EFF6FF', color: '#1D4ED8' }

  return (
    <div className="flex h-screen bg-[#F5F7FB] overflow-hidden">

      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1A3A6B] flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <SanchosLogoSmall />
        </div>

        {/* Profile info */}
        {profile && (
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#2E5FA8] border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : profile.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">{profile.full_name}</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: rb.bg, color: rb.color }}>
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navGroups.map(group => (
            <div key={group.group} className="mb-1">
              {GROUP_LABELS[group.group] && (
                <div className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/30">
                  {GROUP_LABELS[group.group]}
                </div>
              )}
              {group.items.map(item => {
                const Icon   = ICON_MAP[item.icon] ?? LayoutDashboard
                const active = isActive(item.href)
                return (
                  <button key={item.href} onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      active
                        ? 'bg-white/15 text-white border-l-4 border-[#4BAEE8]'
                        : 'text-white/60 hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                    }`}>
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8}/>
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all text-left">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-[#E2E8F4] px-6 py-4 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#0D1B3E]">
              {title ?? flatItems.find(n => isActive(n.href))?.label ?? 'Dashboard'}
            </h1>
            {subtitle && <p className="text-sm text-[#9AAAC8]">{subtitle}</p>}
          </div>
          {isActive('/leads') && (
            <button onClick={() => router.push('/leads')}
              className="bg-[#1A3A6B] text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-[#1F4FA8] transition-colors">
              <Plus size={16}/> Add Lead
            </button>
          )}
        </header>

        {/* Mobile top bar */}
        <header className="md:hidden bg-[#1A3A6B] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <SanchosLogoSmall />
          <button onClick={handleLogout}
            className="border border-white/30 rounded-lg px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1.5">
            <LogOut size={13}/> Logout
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden bg-white border-t border-[#E2E8F4] flex items-center justify-around px-2 pt-2 flex-shrink-0"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          {mobileNav.map((item, i) => {
            const Icon   = ICON_MAP[item.icon] ?? LayoutDashboard
            const active = isActive(item.href)
            const isMiddle = i === Math.floor(mobileNav.length / 2)
            if (isMiddle) return (
              <div key="fab-wrap" className="flex flex-col items-center">
                <button onClick={() => router.push('/leads')}
                  className="w-14 h-14 rounded-full bg-[#1A3A6B] flex items-center justify-center -mt-6 shadow-lg">
                  <Plus size={26} className="text-white"/>
                </button>
              </div>
            )
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-0.5 min-w-[52px] py-1 transition-colors ${
                  active ? 'text-[#1A3A6B]' : 'text-[#B0BDD4]'
                }`}>
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8}/>
                <span className="text-[10px] font-semibold">{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-[#1A3A6B]"/>}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}