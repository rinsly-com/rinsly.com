'use client'

import React from 'react'
import Link from 'next/link'
import { useConfig } from '@payloadcms/ui'

/**
 * Adds a "Deploy" entry to the admin sidebar (admin.components.afterNavLinks)
 * that links to the custom /admin/deploy view. Uses the configured admin route
 * base so it keeps working if that route is ever customised.
 */
export const DeployNavLink: React.FC = () => {
  const { config } = useConfig()
  const adminRoute = config.routes?.admin || '/admin'

  return (
    <Link className="nav__link" href={`${adminRoute}/deploy`} prefetch={false}>
      <span className="nav__link-label">Deploy</span>
    </Link>
  )
}

export default DeployNavLink
