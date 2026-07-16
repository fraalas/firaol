import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`
}

export function initials(name: string) {
  return (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function formatCurrency(n: number | null, suffix = '') {
  if (!n) return '—'
  return `$${n.toLocaleString()}${suffix}`
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const AVATAR_BG = ['#EFF6FF','#F0FDF4','#F0FDFA','#FFFBEB','#FAF5FF','#FEF2F2','#F1F5F9']
export const AVATAR_TC = ['#1D4ED8','#166534','#0F766E','#92400E','#6B21A8','#991B1B','#334155']
