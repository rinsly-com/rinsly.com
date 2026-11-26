import type { FieldAccess } from 'payload'

/**
 * Test stand-in for `@rinsly-com/site-core/access`.
 * Vitest uses this only when that package is not installed.
 * The real `adminFieldOnly` is what production imports.
 */
export const adminFieldOnly: FieldAccess = ({ req: { user } }) => {
  if (typeof user !== 'object' || user === null || !('roles' in user)) return false
  const { roles } = user
  if (!Array.isArray(roles)) return false
  return roles.includes('admin')
}

export const authenticated = () => true

export function isAuthenticated(user: unknown): boolean {
  return user !== null && user !== undefined
}
