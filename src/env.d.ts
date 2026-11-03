declare namespace NodeJS {
  interface ProcessEnv {
    BUILD_STATIC?: string
    CI?: string
    CLOUDFLARE_ENV?: string
    DEPLOY_DISPATCH_EVENT?: string
    DEPLOY_DISPATCH_TOKEN?: string
    DEPLOY_VERSION_MESSAGE?: string
    DEPLOY_VERSION_TAG?: string
    DISPATCH_NAMESPACE?: string
    GITHUB_RUN_ID?: string
    GITHUB_SHA?: string
    NEXT_PUBLIC_API_URL?: string
    NEXT_PUBLIC_SITE_URL?: string
    NEXT_PUBLIC_TURNSTILE_SITEKEY?: string
    NODE_ENV?: string
    NODE_OPTIONS?: string
    PAYLOAD_API_URL?: string
    PAYLOAD_SECRET?: string
    PAYLOAD_SERVER_URL?: string
    PLAYWRIGHT_BASE_URL?: string
    PSI_API_KEY?: string
    RESET_EMAIL?: string
    RESET_PASSWORD?: string
    SEED_ADMIN_EMAIL?: string
    SEED_ADMIN_PASSWORD?: string
  }
}
