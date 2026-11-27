/**
 * Writes the publish manifest with `sourceCommit` = the current git HEAD.
 * Used by scripts/publish-refactor-manifest.ts; node-only (git, fs).
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

import { migrationManifest, type PublishManifest } from './publish'

/**
 * HEAD of a clean tree. Refuses uncommitted changes and untracked files (a
 * new migration or transform that is not committed yet would otherwise feed
 * the hashes without being in `sourceCommit`). Ignored files (.gitignore)
 * don't count.
 */
export function gitHead(cwd?: string): string {
  const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd, encoding: 'utf8' }).trim()
  if (dirty) throw new Error(`[publish-refactor] uncommitted changes, commit first so sourceCommit is the generating commit:\n${dirty}`)
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim()
}

export function writeManifest(target: string, sourceCommit: string = gitHead()): PublishManifest {
  const manifest = migrationManifest(sourceCommit)
  writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}
