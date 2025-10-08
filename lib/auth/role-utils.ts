// Client-safe role utilities (no server-only imports)

export type Role = 'ADMIN' | 'BSS' | 'INFOSEC' | 'AGENT' | 'SUPERVISOR'

// Gets the default dashboard route based on user role
export const getDashboardRouteForRole = (role: Role): string => {
  switch (role) {
    case 'ADMIN':
    case 'SUPERVISOR':
      return '/admin'
    case 'BSS':
    case 'INFOSEC':
      return '/admin/users'
    case 'AGENT':
      return '/admin/leads'
    default:
      return '/auth/login' // Fallback to login
  }
}
