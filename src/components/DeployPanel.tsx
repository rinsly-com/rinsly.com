'use client'

import React, { useCallback, useState } from 'react'
import { Banner, Button, toast, useAuth } from '@payloadcms/ui'

import { isAuthenticated } from '@rinsly-com/site-core/access'
import type { User } from '@/payload-types'
import type { DeployResult } from '../hooks/triggerStaticDeploy'

type PanelState =
  | { phase: 'idle' }
  | { phase: 'deploying' }
  | { phase: 'done'; result: DeployResult }
  | { phase: 'error'; message: string }

/**
 * The interactive body of the admin Deploy view: a single button that POSTs to
 * /api/deploy, which fires a GitHub repository_dispatch to rebuild + redeploy
 * the static production site (rinsly.com) from the current published content.
 *
 * Content changes already trigger a rebuild on publish; this is the manual
 * escape hatch (e.g. re-run a failed build, or ship after an infra change).
 */
export const DeployPanel: React.FC = () => {
  const { user } = useAuth()
  const [state, setState] = useState<PanelState>({ phase: 'idle' })

  const canDeploy = isAuthenticated(user as User | null)
  const deploying = state.phase === 'deploying'

  const deploy = useCallback(async () => {
    setState({ phase: 'deploying' })
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = (await res.json()) as DeployResult & { message: string }
      if (!res.ok && result.status !== 'skipped') {
        throw new Error(result.message || `Request failed (HTTP ${res.status}).`)
      }
      setState({ phase: 'done', result })
      if (result.status === 'triggered') toast.success('Production rebuild triggered.')
      else if (result.status === 'skipped') toast.info(result.message)
    } catch (err) {
      const message = (err as Error).message
      setState({ phase: 'error', message })
      toast.error(message)
    }
  }, [])

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ marginBottom: 'var(--base)' }}>Deploy to production</h1>
      <p style={{ color: 'var(--theme-elevation-600)', marginBottom: 'calc(var(--base) * 1.5)' }}>
        Rebuild and redeploy the public site (<strong>rinsly.com</strong>) from the current
        published content. Publishing a page already triggers this automatically — use this button
        to force a fresh build (e.g. after an infrastructure change or a failed build).
      </p>

      {!canDeploy ? (
        <Banner type="info">Sign in to trigger a production deploy.</Banner>
      ) : (
        <>
          <Button buttonStyle="primary" disabled={deploying} onClick={deploy}>
            {deploying ? 'Triggering…' : 'Deploy now'}
          </Button>

          {state.phase === 'done' && (
            <div style={{ marginTop: 'var(--base)' }}>
              <Banner type={state.result.status === 'triggered' ? 'success' : 'info'}>
                {state.result.message}
              </Banner>
            </div>
          )}
          {state.phase === 'error' && (
            <div style={{ marginTop: 'var(--base)' }}>
              <Banner type="error">{state.message}</Banner>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DeployPanel
