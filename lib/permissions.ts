export type UserRole =
  | 'ceo'
  | 'general_manager'
  | 'hr'
  | 'sales_manager'
  | 'agent'
  | 'staff'

export const FULL_ACCESS_ROLES: UserRole[] = ['ceo', 'general_manager']

export const PERMISSIONS: Record<UserRole, {
  crm:        boolean
  hr:         boolean
  finance:    boolean
  reports:    boolean
  settings:   boolean
  users:      boolean
  admin:      boolean
  export:     boolean
  properties: boolean
  activities: boolean
  ownLeadsOnly: boolean
  manageTeam: boolean
}> = {
  ceo: {
    crm: true, hr: true, finance: true, reports: true,
    settings: true, users: true, admin: true, export: true,
    properties: true, activities: true, ownLeadsOnly: false, manageTeam: true,
  },
  general_manager: {
    crm: true, hr: true, finance: true, reports: true,
    settings: true, users: true, admin: true, export: true,
    properties: true, activities: true, ownLeadsOnly: false, manageTeam: true,
  },
  sales_manager: {
    crm: true, hr: false, finance: false, reports: true,
    settings: false, users: false, admin: false, export: true,
    properties: true, activities: true, ownLeadsOnly: false, manageTeam: true,
  },
  agent: {
    crm: true, hr: false, finance: false, reports: false,
    settings: false, users: false, admin: false, export: false,
    properties: false, activities: true, ownLeadsOnly: true, manageTeam: false,
  },
  hr: {
    crm: false, hr: true, finance: false, reports: false,
    settings: false, users: false, admin: false, export: false,
    properties: false, activities: false, ownLeadsOnly: false, manageTeam: false,
  },
  staff: {
    crm: false, hr: false, finance: false, reports: false,
    settings: false, users: false, admin: false, export: false,
    properties: false, activities: false, ownLeadsOnly: false, manageTeam: false,
  },
}

export function hasPermission(
  role: UserRole | string | null | undefined,
  permission: keyof typeof PERMISSIONS[UserRole]
): boolean {
  if (!role) return false
  const perms = PERMISSIONS[role as UserRole]
  if (!perms) return false
  return perms[permission]
}

export function isFullAccess(role: UserRole | string | null | undefined): boolean {
  return FULL_ACCESS_ROLES.includes(role as UserRole)
}

export const ALL_NAV_ITEMS = [
  {
    group: 'main',
    items: [
      { href: '/dashboard',   label: 'Dashboard',     icon: 'LayoutDashboard', permission: 'always' },
      { href: '/attendance',  label: 'My Attendance', icon: 'Clock',           permission: 'always' },
    ]
  },
  {
    group: 'CRM',
    items: [
      { href: '/leads',      label: 'Leads',      icon: 'Users',           permission: 'crm'        },
      { href: '/activities', label: 'Activities', icon: 'CalendarDays',    permission: 'activities' },
      { href: '/properties', label: 'Properties', icon: 'Home',            permission: 'properties' },
      { href: '/reports',    label: 'Reports',    icon: 'BarChart2',       permission: 'reports'    },
      { href: '/export',     label: 'Export',     icon: 'Download',        permission: 'export'     },
      { href: '/sales/team', label: 'My Team',    icon: 'UserCheck',       permission: 'manageTeam' },
    ]
  },
  {
    group: 'HR',
    items: [
      { href: '/hr/employees',  label: 'Employees',   icon: 'UserCheck',   permission: 'hr' },
      { href: '/hr/attendance', label: 'Attendance',  icon: 'Clock',       permission: 'hr' },
      { href: '/hr/leave',      label: 'Leave',       icon: 'CalendarOff', permission: 'always' },
    ]
  },
  {
    group: 'System',
    items: [
      { href: '/admin',    label: 'Admin',    icon: 'ShieldCheck', permission: 'admin'    },
      { href: '/settings', label: 'Settings', icon: 'Settings',    permission: 'settings' },
      { href: '/profile',  label: 'Profile',  icon: 'User',        permission: 'always'   },
    ]
  },
]

export function getNavItems(role: UserRole | string | null | undefined) {
  if (!role) return []
  return ALL_NAV_ITEMS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.permission === 'always') return true
      if (isFullAccess(role)) return true
      return hasPermission(role, item.permission as keyof typeof PERMISSIONS[UserRole])
    })
  })).filter(group => group.items.length > 0)
}

export const ROLE_LABELS: Record<string, string> = {
  ceo:             'CEO',
  general_manager: 'General Manager',
  hr:              'HR Manager',
  sales_manager:   'Sales Manager',
  agent:           'Agent',
  staff:           'Staff',
}

export const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  ceo:             { bg: '#FEF2F2', color: '#991B1B' },
  general_manager: { bg: '#FEF2F2', color: '#991B1B' },
  hr:              { bg: '#F0FDF4', color: '#166534' },
  sales_manager:   { bg: '#EFF6FF', color: '#1D4ED8' },
  agent:           { bg: '#F0FDFA', color: '#0F766E' },
  staff:           { bg: '#F5F7FB', color: '#4A5880' },
}

// Exact title shown under the person's name in the header profile menu
export const ROLE_TITLES: Record<string, string> = {
  ceo:             'Chief Executive Officer',
  general_manager: 'General Manager',
  hr:              'Human Resources',
  sales_manager:   'Sales Manager',
  agent:           'Sales Agent',
  staff:           'Staff',
}

// Roles allowed to edit department/position (their own or others')
export const CAN_EDIT_ORG_FIELDS: UserRole[] = ['ceo', 'general_manager', 'hr']