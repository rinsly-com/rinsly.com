import { describe, expect, it, vi } from 'vitest'

import { loadMotionOrShowFinal } from '@/components/custom/product/motionLoad'

describe('RinslyMotion GSAP load', () => {
  it('a failed chunk load removes .anim (final picture) and resolves undefined', async () => {
    const remove = vi.fn()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await expect(loadMotionOrShowFinal(() => Promise.reject(new Error('ChunkLoadError')), { classList: { remove } })).resolves.toBeUndefined()
    expect(remove).toHaveBeenCalledWith('anim')
    warn.mockRestore()
  })

  it('a successful load keeps .anim and returns the modules', async () => {
    const remove = vi.fn()
    await expect(loadMotionOrShowFinal(() => Promise.resolve('gsap'), { classList: { remove } })).resolves.toBe('gsap')
    expect(remove).not.toHaveBeenCalled()
  })
})
