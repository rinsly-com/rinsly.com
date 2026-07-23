import type { PayloadHandler, PayloadRequest } from 'payload'

import { isAuthenticated } from '@rinsly-com/site-core/access'
import type { User } from '@/payload-types'
import { triggerDeploy } from '../hooks/triggerStaticDeploy'

/**
 * POST /api/deploy — manually trigger a static production rebuild from the
 * current published (accp) content, without having to (re)publish a document.
 *
 * Backs the admin "Deploy" view. Any signed-in editor/admin may trigger it
 * (the same people who can publish). Uses the shared triggerDeploy helper so
 * the manual path and the on-publish hooks fire the exact same GitHub dispatch.
 */
export const deployHandler: PayloadHandler = async (req: PayloadRequest): Promise<Response> => {
  const user = req.user as User | null

  if (!isAuthenticated(user)) {
    return Response.json(
      { status: 'forbidden', message: 'Sign in to trigger a production deploy.' },
      { status: 403 },
    )
  }

  const result = await triggerDeploy(req.payload, `manual deploy by ${user?.email ?? 'unknown'}`)

  // 502 when the dispatch actually failed; 200 for triggered/skipped so the UI
  // can show the skipped-because-unconfigured case as a normal (non-error) note.
  const httpStatus = result.status === 'failed' ? 502 : 200
  return Response.json(result, { status: httpStatus })
}
