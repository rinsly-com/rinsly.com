'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

type IconModule = Record<string, React.ComponentType<{ size?: number; stroke?: number }> | undefined>

/** A short list of on-brand defaults shown before the editor searches. */
const SUGGESTED = [
  'IconHeart',
  'IconHeartHandshake',
  'IconStar',
  'IconRocket',
  'IconSparkles',
  'IconUsers',
  'IconUser',
  'IconPhone',
  'IconMail',
  'IconMapPin',
  'IconClock',
  'IconBriefcase',
  'IconDiamond',
  'IconBrandInstagram',
  'IconShieldCheck',
  'IconListCheck',
  'IconCheck',
  'IconArrowRight',
  'IconMoodSmile',
  'IconThumbUp',
]

const MAX_RESULTS = 240

// Cache the (large) icon barrel across mounts so switching between icon fields
// on a page doesn't re-import it each time.
let cachedModule: IconModule | null = null

/**
 * Payload field component: a searchable, visual picker over the full Tabler
 * icon set. Stores the icon's component name (e.g. `IconHeart`) as plain text.
 *
 * The icon barrel is imported lazily on mount, so it never weighs down the
 * admin's initial load — only editing a document with an icon field pulls it in.
 */
export const IconSelector: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })
  const [mod, setMod] = useState<IconModule | null>(cachedModule)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (cachedModule) return
    let active = true
    void import('@tabler/icons-react').then((m) => {
      // Depending on the bundler's ESM/CJS interop, the icon exports may sit on
      // the namespace directly or under `default` — pick whichever holds them.
      const ns = m as unknown as Record<string, unknown>
      const hasIcons = Object.keys(ns).some((k) => k.startsWith('Icon'))
      cachedModule = (hasIcons ? ns : ((ns.default as object) ?? ns)) as IconModule
      if (active) setMod(cachedModule)
    })
    return () => {
      active = false
    }
  }, [])

  const names = useMemo(
    () =>
      mod
        ? Object.keys(mod).filter((k) => k.startsWith('Icon') && Boolean(mod[k]))
        : [],
    [mod],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '')
    if (!q) {
      const set = new Set(names)
      return SUGGESTED.filter((n) => set.has(n))
    }
    return names.filter((n) => n.toLowerCase().includes(q)).slice(0, MAX_RESULTS)
  }, [names, query])

  const Selected = value && mod ? mod[value] : undefined

  const label = typeof field?.label === 'string' ? field.label : 'Icon'

  return (
    <div className="field-type" style={{ marginBottom: 'var(--base)' }}>
      <FieldLabel label={label} path={path} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 8,
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          background: 'var(--theme-elevation-0)',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 4,
            background: 'var(--theme-elevation-50)',
            color: 'var(--theme-text)',
            flexShrink: 0,
          }}
        >
          {Selected ? <Selected size={22} stroke={2} /> : <span style={{ opacity: 0.4 }}>—</span>}
        </span>

        <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }}>
          {value || <span style={{ opacity: 0.6 }}>Geen icoon geselecteerd</span>}
        </span>

        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={() => setOpen((o) => !o)}
          style={{ margin: 0 }}
        >
          {open ? 'Sluiten' : value ? 'Wijzigen' : 'Kies icoon'}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn--style-secondary btn--size-small"
            onClick={() => setValue('')}
            style={{ margin: 0 }}
          >
            Wissen
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            marginTop: 8,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 4,
            padding: 12,
            background: 'var(--theme-elevation-0)',
          }}
        >
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek een icoon, bijv. heart, arrow, phone…"
            className="field-type text"
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 4,
              background: 'var(--theme-input-bg, var(--theme-elevation-0))',
              color: 'var(--theme-text)',
              marginBottom: 10,
            }}
          />

          {!mod ? (
            <p style={{ opacity: 0.6, fontSize: 13 }}>Icoonbibliotheek laden…</p>
          ) : (
            <>
              <p style={{ opacity: 0.6, fontSize: 12, margin: '0 0 8px' }}>
                {query.trim()
                  ? `${results.length} resultaat${results.length === 1 ? '' : 'en'}${
                      results.length === MAX_RESULTS ? '+ (verfijn je zoekopdracht)' : ''
                    }`
                  : 'Voorgestelde iconen — typ om alle iconen te doorzoeken'}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
                  gap: 6,
                  maxHeight: 320,
                  overflowY: 'auto',
                }}
              >
                {results.map((name) => {
                  const Cmp = mod[name]
                  if (!Cmp) return null
                  const active = name === value
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => {
                        setValue(name)
                        setOpen(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        aspectRatio: '1',
                        border: active
                          ? '2px solid var(--theme-success-500, #2e8b57)'
                          : '1px solid var(--theme-elevation-150)',
                        borderRadius: 6,
                        background: active ? 'var(--theme-elevation-50)' : 'transparent',
                        color: 'var(--theme-text)',
                        cursor: 'pointer',
                      }}
                    >
                      <Cmp size={22} stroke={2} />
                    </button>
                  )
                })}
              </div>
              {query.trim() && results.length === 0 && (
                <p style={{ opacity: 0.6, fontSize: 13, margin: '8px 0 0' }}>
                  Geen iconen gevonden voor “{query}”.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default IconSelector
