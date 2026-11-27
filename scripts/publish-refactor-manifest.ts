/**
 * Writes src/lib/contentRefactor/publish-manifest.json: the expected draft and
 * pre-publish hashes the publish step checks, with `sourceCommit` = git HEAD.
 * Run it in the PR that changes the drafts (a new migration or transform),
 * and commit the result:
 *   pnpm content:publish-refactor:manifest
 * The contract (version, hash definition, sourceCommit) is in
 * docs/runbook-refactor-part2-content.md, "Publish manifest".
 */
import { fileURLToPath } from 'node:url'

import { writeManifest } from '../src/lib/contentRefactor/manifestFile'

const target = fileURLToPath(new URL('../src/lib/contentRefactor/publish-manifest.json', import.meta.url))
const manifest = writeManifest(target)
console.log(`wrote ${target} (sourceCommit ${manifest.sourceCommit})`)
