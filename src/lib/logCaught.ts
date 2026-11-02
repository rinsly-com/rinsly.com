/** Log a caught error with a stable context prefix. Never swallows silently. */
export function logCaught(context: string, err: unknown): void {
  const detail = err instanceof Error ? err.message : String(err)
  console.error(`${context}: ${detail}`)
}
