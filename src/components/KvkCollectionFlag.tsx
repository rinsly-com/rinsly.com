'use client'

import { createContext, useContext, type ReactNode } from 'react'

const KvkCollectionFlagContext = createContext<boolean | undefined>(undefined)

/** Holds the server-resolved collection flag for client trees (live preview, and the hydrated form). */
export function KvkCollectionFlagProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: ReactNode
}) {
  return (
    <KvkCollectionFlagContext.Provider value={enabled}>{children}</KvkCollectionFlagContext.Provider>
  )
}

/** `false` when no provider is mounted, so a missing wrapper fails closed. */
export function useKvkCollectionFlag(): boolean {
  return useContext(KvkCollectionFlagContext) ?? false
}
