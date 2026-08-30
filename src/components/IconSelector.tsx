/**
 * The icon picker, re-exported for Payload to resolve.
 *
 * Payload resolves `admin.components` paths against THIS app rather than
 * against the package, and the engine's `fields/icon.ts` points every icon
 * field at `/components/IconSelector`. So the path has to exist here — but the
 * implementation does not, and should not: it used to be copied into every
 * site, which is how one hydration bug came to live in each of them separately.
 *
 * Re-run `pnpm generate:importmap` if this file's exports change.
 */
export { IconSelector } from '@rinsly-com/site-core/admin'
