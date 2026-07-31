'use client'
import { LucideIcon } from 'lucide-react'

interface Action {
  label: string
  onClick: () => void
}

interface Props {
  icon: LucideIcon | string
  title: string
  subtitle?: string
  action?: Action
  // Back-compat with an earlier alternate API (actionLabel/onAction) —
  // supported so any other call sites using this shape keep working.
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, subtitle, action, actionLabel, onAction }: Props) {
  const resolvedAction = action ?? (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined)

  return (
    <div className="text-center py-16 px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-[#F0F4FB] flex items-center justify-center mx-auto mb-4">
        {typeof Icon === 'string'
          ? <span className="text-3xl">{Icon}</span>
          : <Icon size={28} className="text-[#9AAAC8]" strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-semibold text-[#4A5880] mb-1">{title}</p>
      {subtitle && <p className="text-xs text-[#9AAAC8] mb-4 max-w-xs mx-auto">{subtitle}</p>}
      {resolvedAction && (
        <button onClick={resolvedAction.onClick}
          className="text-xs font-bold text-[#075290] hover:text-[#1F4FA8] transition-colors">
          {resolvedAction.label}
        </button>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  )
}