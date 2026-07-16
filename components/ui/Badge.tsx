interface BadgeProps {
  label: string
  bg: string
  color: string
  size?: 'sm' | 'md'
}
export function Badge({ label, bg, color, size = 'md' }: BadgeProps) {
  const cls = size === 'sm'
    ? 'text-[9px] px-1.5 py-0.5'
    : 'text-[10px] px-2.5 py-1'
  return (
    <span className={`inline-block font-bold rounded-full ${cls}`} style={{ background: bg, color }}>
      {label}
    </span>
  )
}
