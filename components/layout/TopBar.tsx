'use client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SanchosLogoSmall } from '@/components/ui/SanchosLogo'

interface TopBarProps {
  title?: string
  subtitle?: string
  right?: React.ReactNode
}

export function TopBar({ title, subtitle, right }: TopBarProps) {
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.replace('/auth/login')
  }

  return (
    <header className="bg-[#075290] px-4 py-3 flex items-center justify-between flex-shrink-0">
      {title ? (
        <div>
          <div className="text-white font-bold text-[16px] leading-tight">{title}</div>
          {subtitle && <div className="text-white/50 text-[11px]">{subtitle}</div>}
        </div>
      ) : (
        <SanchosLogoSmall />
      )}
      <div className="flex items-center gap-2">
        {right}
        <button onClick={handleLogout}
          className="border border-white/30 rounded-lg px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-white/10 transition-colors">
          <LogOut size={13} /> Logout
        </button>
      </div>
    </header>
  )
}
