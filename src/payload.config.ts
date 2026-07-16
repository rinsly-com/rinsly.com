import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig, type Plugin } from 'payload'
import { en } from '@payloadcms/translations/languages/en'
import { nl } from '@payloadcms/translations/languages/nl'
import { fileURLToPath } from 'url'
import { type CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { seoPlugin } from '@payloadcms/plugin-seo'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Offertes } from './collections/Offertes'
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
import { offerteHandler } from './endpoints/offerte'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

// True when running the Payload CLI (e.g. `payload migrate`), where there is no
// Workers runtime and bindings must come from wrangler's platform proxy instead.
const isCLI = process.argv.some((value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'
// True during `next build` (including the build run inside
// `opennextjs-cloudflare build`). The build must NOT open the remote D1: Next
// collects page data with several parallel workers, and each one opening the
// single remote D1 preview session makes Cloudflare return SQLITE_BUSY
// ("database is locked"). During the build we use a LOCAL binding mock instead.
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build'

// Payload's default logger uses pino-pretty, which relies on Node APIs not
// available in the Workers runtime. In production route logs through console.*.
const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any // Use PayloadLogger type when it's exported

// The deployed Worker reads live bindings via getCloudflareContext. Local dev,
// the Payload CLI, and the Next build all use wrangler's platform proxy — but
// only the CLI (e.g. `payload migrate`) talks to the REAL remote D1; the build
// uses a local mock (see isNextBuild above).
const cloudflare =
  isCLI || !isProduction || isNextBuild
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

// R2 is optional: only wire the storage adapter when the binding exists.
// Without it, uploads fall back to the local filesystem in dev.
const env = cloudflare.env as unknown as Record<string, unknown>
const plugins: Plugin[] = []
if (env.R2) {
  plugins.push(
    r2Storage({
      bucket: env.R2 as never,
      collections: { media: true },
    }),
  )
}

// SEO: adds a `meta` group (title / description / image) to Pages so editors
// control per-page search + social metadata, plus a per-page noindex switch.
plugins.push(
  seoPlugin({
    collections: ['pages'],
    uploadsCollection: 'media',
    tabbedUI: true,
    generateTitle: ({ doc }: { doc?: { title?: string } }) =>
      doc?.title ? `${doc.title} — Rinsly` : 'Rinsly',
    generateDescription: ({ doc }: { doc?: { title?: string } }) =>
      doc?.title
        ? `${doc.title} — webontwikkeling & beheer bij Rinsly.`
        : 'Rinsly — webontwikkeling & beheer.',
    fields: ({ defaultFields }) => [
      ...defaultFields,
      {
        name: 'noindex',
        type: 'checkbox',
        label: {
          en: 'Hide this page from search engines (noindex)',
          nl: 'Deze pagina verbergen voor zoekmachines (noindex)',
        },
        admin: {
          description: {
            en: 'When on, search engines are asked not to index or follow this page.',
            nl: 'Indien aan, wordt zoekmachines gevraagd deze pagina niet te indexeren of te volgen.',
          },
        },
      },
    ],
  }),
)

// sharp is a native module used by Payload for image crop/resize. The Workers
// runtime can't load native addons, so load it only in Node (local dev + CLI);
// on the Worker it stays undefined. The specifier is obfuscated so the Worker
// bundle never includes it.
const sharp =
  isCLI || !isProduction
    ? ((await import(/* webpackIgnore: true */ `${'__sharp'.replaceAll('_', '')}`)) as { default: unknown })
        .default
    : undefined

// Origins allowed to call the API from a browser. Admin + frontend are the same
// worker, so the site's own origin must be allow-listed.
const frontendOrigins = (process.env.FRONTEND_URL || 'https://rinsly.com')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
const corsOrigins = Array.from(
  new Set([...frontendOrigins, 'https://rinsly.nl', 'http://localhost:3000']),
)

export default buildConfig({
  sharp: sharp as never,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Pages, Offertes],
  globals: [Header, Footer],
  // Public quote-request submission (see src/endpoints/offerte.ts).
  endpoints: [{ path: '/offerte', method: 'post', handler: offerteHandler }],
  // Field-level content localization: the same document carries both languages,
  // and untranslated fields fall back to the default locale (Dutch).
  localization: {
    locales: [
      { label: 'Nederlands', code: 'nl' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'nl',
    fallback: true,
  },
  // Admin-panel UI language (buttons, nav, login). Custom field labels are
  // localized in place via { en, nl } label objects.
  i18n: {
    supportedLanguages: { nl, en },
    fallbackLanguage: 'nl',
  },
  cors: corsOrigins,
  csrf: corsOrigins,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins,
})

// Adapted from opennextjs-cloudflare's cloudflare-context helper.
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        // Remote bindings only for the production Payload CLI (migrations).
        // Never during the Next build (would lock D1) or local dev.
        remoteBindings: isProduction && isCLI && !isNextBuild,
      } satisfies GetPlatformProxyOptions),
  )
}
