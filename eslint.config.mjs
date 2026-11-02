import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import tseslint from 'typescript-eslint'

// eslint-config-next 16 ships native flat configs, so FlatCompat is no longer
// needed (and crashes when validating them). Type-aware rules apply only to
// TypeScript; generated Payload output and migrations stay out of lint.
// next/typescript already registers @typescript-eslint. strict-type-checked
// registers it again, which flat config rejects, so keep its rules and parser
// options and leave the plugin to Next.
const strictTypeChecked = tseslint.configs.strictTypeChecked.map((config) => {
  if (!config || typeof config !== 'object' || !('plugins' in config)) return config
  const rest = { ...config }
  delete rest.plugins
  return rest
})

const eslintConfig = tseslint.config(
  {
    ignores: [
      '.next/',
      '.open-next/',
      '.wrangler/',
      '.static-build-backup/',
      'out/',
      'cloudflare-env.d.ts',
      'src/migrations/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      // Numbers stringify unambiguously. The preset rejects them and would
      // rewrite every price and count in the seed copy.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
)

export default eslintConfig
