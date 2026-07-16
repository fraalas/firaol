'use client'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Plus, CalendarDays, User } from 'lucide-react'

const NAV = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/leads',      icon: Users,            label: 'Leads'      },
  null,
  { href: '/activities', icon: CalendarDays,     label: 'Activities' },
  { href: '/profile',    icon: User,             label: 'Profile'    },
]

export function MobileNav() {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white border-t border-[#E2E8F4] flex items-center justify-around px-2 pt-2 z-40"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      {NAV.map((item, i) => {
        if (!item) return (
          <button key="fab" onClick={() => router.push('/leads')}
            className="w-14 h-14 rounded-full bg-[#1A3A6B] flex items-center justify-center -mt-6 shadow-lg active:scale-95 transition-transform">
            <Plus size={26} className="text-white" />
          </button>
        )
        const Icon   = item.icon
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <button key={item.href} onClick={() => router.push(item.href)}
            className={`flex flex-col items-center gap-0.5 min-w-[52px] py-1 transition-colors ${active ? 'text-[#1A3A6B]' : 'text-[#B0BDD4]'}`}>
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span className="text-[10px] font-semibold">{item.label}</span>
            {active && <span className="w-1 h-1 rounded-full bg-[#1A3A6B]" />}
          </button>
        )
      })}
    </nav>
  )
}
