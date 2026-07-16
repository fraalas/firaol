interface EmptyStateProps {
  icon: string
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}
export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="text-sm font-semibold text-[#4A5880]">{title}</div>
      {subtitle && <div className="text-xs text-[#9AAAC8] mt-1">{subtitle}</div>}
      {action && (
        <button onClick={action.onClick}
          className="mt-4 text-xs font-bold text-[#1F4FA8] bg-[#EFF6FF] px-4 py-2 rounded-full">
          {action.label}
        </button>
      )}
    </div>
  )
}
