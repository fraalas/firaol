import type { LeadStage, LeadSource, ActivityType } from '@/types/database'

export const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bg: string; border: string }> = {
  new_lead:       { label: 'New Lead',       color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  contacted:      { label: 'Contacted',      color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  interested:     { label: 'Interested',     color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  property_visit: { label: 'Property Visit', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  negotiation:    { label: 'Negotiation',    color: '#6B21A8', bg: '#FAF5FF', border: '#DDD6FE' },
  closed:         { label: 'Closed',         color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  lost:           { label: 'Lost',           color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
}

export const STAGES: LeadStage[] = ['new_lead','contacted','interested','property_visit','negotiation','closed','lost']
export const PIPELINE_STAGES: LeadStage[] = ['new_lead','contacted','interested','property_visit','negotiation','closed']

export const SOURCE_CONFIG: Record<LeadSource, { label: string }> = {
  referral:  { label: 'Referral'  },
  website:   { label: 'Website'   },
  social:    { label: 'Social'    },
  walk_in:   { label: 'Walk-in'   },
  cold_call: { label: 'Cold Call' },
  other:     { label: 'Other'     },
}

export const ACTIVITY_CONFIG: Record<ActivityType, { label: string; bg: string; color: string; emoji: string }> = {
  call:       { label: 'Call',       bg: '#EFF6FF', color: '#1D4ED8', emoji: '📞' },
  meeting:    { label: 'Meeting',    bg: '#F0FDF4', color: '#166534', emoji: '👥' },
  site_visit: { label: 'Site Visit', bg: '#F0FDFA', color: '#0F766E', emoji: '📍' },
  follow_up:  { label: 'Follow-up',  bg: '#FEF2F2', color: '#DC2626', emoji: '🔔' },
  contract:   { label: 'Contract',   bg: '#FAF5FF', color: '#6B21A8', emoji: '📄' },
  other:      { label: 'Other',      bg: '#FFFBEB', color: '#92400E', emoji: '📅' },
}

export const PROPERTY_STATUS_CONFIG = {
  available: { label: 'Available', bg: '#EFF6FF', color: '#1D4ED8' },
  sold:      { label: 'Sold',      bg: '#ECFDF5', color: '#065F46' },
  rented:    { label: 'Rented',    bg: '#FFFBEB', color: '#92400E' },
}

export const NAVY = '#1A3A6B'
export const BLUE = '#1F4FA8'
