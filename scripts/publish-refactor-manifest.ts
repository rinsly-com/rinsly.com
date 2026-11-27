/**
 * Writes src/lib/contentRefactor/publish-manifest.json: the expected draft and
 * pre-publish hashes the publish step checks. Run it in the PR that changes
 * the drafts (a new migration or transform), and commit the result:
 *   pnpm content:publish-refactor:manifest
 * A redesign that writes its drafts another way can also put its own hashes
 * in the file (fullHash in src/lib/contentRefactor/publish.ts).
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { migrationManifest } from '../src/lib/contentRefactor/publish'

const target = fileURLToPath(new URL('../src/lib/contentRefactor/publish-manifest.json', import.meta.url))
writeFileSync(target, `${JSON.stringify(migrationManifest(), null, 2)}\n`)
console.log(`wrote ${target}`)
