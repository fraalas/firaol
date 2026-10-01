'use client'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Plus, CalendarDays, User,
  Home, BarChart2, Download, ShieldCheck, LogOut,
  UserCheck, Clock, CalendarOff, Wallet,
  TrendingUp, TrendingDown, BadgeDollarSign, Settings,
  ChevronDown, FileText
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
  FileText,
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

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
    <div className="flex h-screen overflow-hidden font-app" style={{ background: '#0A0E1A' }}>

      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0D1526 0%, #0A0E1A 100%)',
          borderRight: '1px solid rgba(59,130,246,0.12)',
        }}>

        {/* Ambient glow accents */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="px-6 py-6 relative z-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <SanchosLogoSmall />
        </div>

        {/* Profile info */}
        {profile && (
          <div className="px-4 py-4 flex items-center gap-3 relative z-10"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                boxShadow: '0 0 16px rgba(59,130,246,0.45)',
              }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : profile.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">{profile.full_name}</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' }}>
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto relative z-10">
          {navGroups.map(group => {
            const label = GROUP_LABELS[group.group]
            const isCollapsed = collapsed[group.group]
            return (
              <div key={group.group} className="mb-1">
                {label && (
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [group.group]: !prev[group.group] }))}
                    className="w-full flex items-center justify-between px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/25 hover:text-white/45 transition-colors"
                  >
                    <span>{label}</span>
                    <ChevronDown size={12} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}
                {!isCollapsed && group.items.map(item => {
                  const Icon   = ICON_MAP[item.icon] ?? LayoutDashboard
                  const active = isActive(item.href)
                  return (
                    <button key={item.href} onClick={() => router.push(item.href)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all duration-200"
                      style={active ? {
                        background: 'linear-gradient(90deg, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.05) 100%)',
                        color: '#FFFFFF',
                        boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.35), 0 0 20px rgba(59,130,246,0.15)',
                      } : {
                        color: 'rgba(255,255,255,0.55)',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} style={active ? { color: '#60A5FA' } : undefined} />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-all text-left">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-4 flex-shrink-0 relative"
          style={{
            background: 'rgba(13,21,38,0.6)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(59,130,246,0.12)',
          }}>
          <div>
            <h1 className="text-xl font-bold text-white">
              {title ?? flatItems.find(n => isActive(n.href))?.label ?? 'Dashboard'}
            </h1>
            {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
          </div>
          {isActive('/leads') && (
            <button onClick={() => router.push('/leads')}
              className="text-white font-bold px-5 py-2.5 rounded-2xl text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                boxShadow: '0 0 20px rgba(59,130,246,0.4)',
              }}>
              <Plus size={16}/> Add Lead
            </button>
          )}
        </header>

        {/* Mobile top bar */}
        <header className="md:hidden px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ background: 'rgba(13,21,38,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(59,130,246,0.12)' }}>
          <SanchosLogoSmall />
          <button onClick={handleLogout}
            className="rounded-xl px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1.5"
            style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
            <LogOut size={13}/> Logout
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto" style={{ background: '#0A0E1A' }}>
          <div className="h-full">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around px-2 pt-2 flex-shrink-0"
          style={{
            background: 'rgba(13,21,38,0.9)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(59,130,246,0.12)',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}>
          {mobileNav.map((item, i) => {
            const Icon   = ICON_MAP[item.icon] ?? LayoutDashboard
            const active = isActive(item.href)
            const isMiddle = i === Math.floor(mobileNav.length / 2)
            if (isMiddle) return (
              <div key="fab-wrap" className="flex flex-col items-center">
                <button onClick={() => router.push('/leads')}
                  className="w-14 h-14 rounded-full flex items-center justify-center -mt-6"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    boxShadow: '0 0 24px rgba(59,130,246,0.55)',
                  }}>
                  <Plus size={26} className="text-white"/>
                </button>
              </div>
            )
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                className="flex flex-col items-center gap-0.5 min-w-[52px] py-1 transition-colors"
                style={{ color: active ? '#60A5FA' : 'rgba(255,255,255,0.35)' }}>
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8}/>
                <span className="text-[10px] font-semibold">{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full" style={{ background: '#60A5FA', boxShadow: '0 0 6px #60A5FA' }}/>}
              </button>
            )
          })}
        </nav>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .font-app, .font-app * { font-family: 'Inter', -apple-system, sans-serif; }
      `}</style>
    </div>
  )
}