import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import React from 'react'

import { DeployPanel } from './DeployPanel'

/**
 * Custom admin view mounted at /admin/deploy (see admin.components.views in
 * payload.config.ts). A Server Component: it renders the standard admin chrome
 * (nav + header) via DefaultTemplate around the interactive DeployPanel, using
 * the request context Payload passes to every custom view.
 */
export const DeployView: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
}) => {
  const { req, permissions, visibleEntities } = initPageResult

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <DeployPanel />
      </Gutter>
    </DefaultTemplate>
  )
}

export default DeployView
