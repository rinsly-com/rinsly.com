import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))
const siteCoreInstalled = existsSync(path.join(root, 'node_modules/@rinsly-com/site-core/package.json'))

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: siteCoreInstalled
    ? undefined
    : {
        alias: {
          '@rinsly-com/site-core/access': path.join(root, 'tests/stubs/site-core-access.ts'),
        },
      },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.unit.spec.ts'],
  },
})
