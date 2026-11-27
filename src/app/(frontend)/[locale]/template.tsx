import { KvkCollectionFlagProvider } from '@/components/KvkCollectionFlag'
import { isKvkCollectionEnabled } from '@/lib/kvkCollectionFlag'

/**
 * Resolves the KvK collection flag on the server (accp request, or the static
 * build) and hands the boolean to client trees, including live preview.
 * `Contact` must not read the env itself: PreviewShell is a client module.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <KvkCollectionFlagProvider enabled={isKvkCollectionEnabled()}>
      {children}
    </KvkCollectionFlagProvider>
  )
}
