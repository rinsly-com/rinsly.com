/**
 * Loads the GSAP chunk for RinslyMotion. If the import fails (chunk 404, an
 * offline cache, a blocked script), drop `.anim` from <html>: every hidden
 * start state is CSS under `.anim`, so this shows the final picture (hero
 * frame and phone in place, step overlays gone) instead of leaving them at
 * their start state. Resolves to `undefined` then; never rejects.
 */
export async function loadMotionOrShowFinal<T>(
  load: () => Promise<T>,
  root: { classList: { remove: (token: string) => void } } = document.documentElement,
): Promise<T | undefined> {
  try {
    return await load()
  } catch (error) {
    root.classList.remove('anim')
    console.warn('[RinslyMotion] GSAP failed to load; showing the final state', error)
    return undefined
  }
}
