import React from 'react'

import type { Page } from '@/payload-types'

/**
 * Fallback renderer for a page with no block layout — just its title. Server
 * component (no client runtime).
 */
export const PageView: React.FC<{ page: Page }> = ({ page }) => {
  return (
    <article className="mx-auto w-full max-w-[1080px] px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink sm:text-4xl">
        {page.title}
      </h1>
    </article>
  )
}

export default PageView
