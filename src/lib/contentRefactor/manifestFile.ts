/**
 * Writes the publish manifest with `sourceCommit` = the current git HEAD.
 * Used by scripts/publish-refactor-manifest.ts; node-only (git, fs).
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

import { migrationManifest, type PublishManifest } from './publish'

export function gitHead(cwd?: string): string {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim()
}

export function writeManifest(target: string, sourceCommit: string = gitHead()): PublishManifest {
  const manifest = migrationManifest(sourceCommit)
  writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}
