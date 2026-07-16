import React from 'react'

/**
 * Renders one `<script type="application/ld+json">` tag. `data` may be a single
 * JSON-LD object or an array of them (both are valid top-level JSON-LD).
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
