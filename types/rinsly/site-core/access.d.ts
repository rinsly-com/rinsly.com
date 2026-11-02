import type { Access } from 'payload'

import type { User } from '@/payload-types'

/** Client auth user is not the generated `User`; callers narrow with a cast. */
export function isAuthenticated(user: User | null): boolean
export const authenticated: Access
