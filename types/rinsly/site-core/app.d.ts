export function createAppleTouchIcon(opts: unknown): {
  GET: (request: Request) => Response | Promise<Response>
}

export function createOgImage(opts: unknown): {
  size: { width: number; height: number }
  contentType: string
  alt: string
  generateStaticParams: () => Promise<unknown>
  Image: (args: unknown) => Promise<unknown>
}

export function createSlugRoute(opts: unknown): {
  generateStaticParams: () => Promise<unknown>
  generateMetadata: (args: unknown) => Promise<unknown>
  Page: (args: unknown) => unknown
}

export function createLocaleLayout(opts: unknown): {
  viewport: unknown
  generateStaticParams: () => Promise<unknown>
  generateMetadata: (args: unknown) => Promise<unknown>
  Layout: (args: unknown) => unknown
}

export function createHomeRoute(opts: unknown): {
  generateMetadata: (args: unknown) => Promise<unknown>
  Page: (args: unknown) => unknown
}
