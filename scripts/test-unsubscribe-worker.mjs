/**
 * Built-worker checks for marketing unsubscribe headers and status codes.
 *
 * OpenNext's routingHandler.apply-order is not enough: handleRedirects can
 * return a 307 before next.config headers(). This script starts the already
 * built `.open-next` worker with wrangler dev, a fake secret, and local
 * bindings only (no remote D1/R2, no repo `.dev.vars`).
 *
 * Requires a prior `opennextjs-cloudflare build`.
 */
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractSqlTemplates } from './lint-migrations.mjs'
import { mintUnsubscribeToken } from '../src/lib/unsubscribeToken.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WORKER = path.join(ROOT, '.open-next/worker.js')
const ASSETS = path.join(ROOT, '.open-next/assets')
const FAKE_SECRET = 'test-secret-do-not-use-in-production'
const BOGUS = 'v1.not-a-real-hashAAAAAAA-not-a-real.sigAAAAAAAAAAAAAAAAAAAAA'

function fail(message) {
  console.error(`FAIL ${message}`)
  throw new Error(message)
}

function ok(message) {
  console.log(`PASS ${message}`)
}

function headerLine(headers, name) {
  return `${name}: ${headers.get(name) ?? '<missing>'}`
}

function assertSingleHeader(headers, name, expected) {
  const value = headers.get(name)
  if (value !== expected) {
    fail(`${name}: expected exactly ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`)
  }
}

function assertUnsubscribeHeaders(headers, context) {
  try {
    assertSingleHeader(headers, 'referrer-policy', 'no-referrer')
    assertSingleHeader(headers, 'cache-control', 'no-store')
    ok(`${context}: Referrer-Policy=no-referrer Cache-Control=no-store (single values)`)
  } catch (err) {
    console.error(`-- ${context} headers --`)
    console.error(headerLine(headers, 'referrer-policy'))
    console.error(headerLine(headers, 'cache-control'))
    console.error(headerLine(headers, 'location'))
    throw err
  }
}

function printHeaders(label, response) {
  console.log(`----- ${label} ${response.status} -----`)
  console.log(headerLine(response.headers, 'location'))
  console.log(headerLine(response.headers, 'referrer-policy'))
  console.log(headerLine(response.headers, 'cache-control'))
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        server.close()
        reject(new Error('could not bind a free port'))
        return
      }
      const port = addr.port
      server.close((err) => (err ? reject(err) : resolve(port)))
    })
    server.on('error', reject)
  })
}

async function waitForServer(url, child, timeoutMs = 90_000) {
  const start = Date.now()
  let lastErr
  while (Date.now() - start < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`wrangler exited early with code ${child.exitCode}`)
    }
    try {
      await fetch(url, { redirect: 'manual' })
      return
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  throw new Error(`wrangler did not become ready: ${lastErr?.message ?? 'timeout'}`)
}

function startWrangler({ configDir, persistDir, port, secret }) {
  const wranglerBin = path.join(ROOT, 'node_modules/.bin/wrangler')
  const args = [
    'dev',
    '--config',
    path.join(configDir, 'wrangler.json'),
    '--port',
    String(port),
    '--ip',
    '127.0.0.1',
    '--persist-to',
    persistDir,
    '--local',
    '--show-interactive-dev-session',
    'false',
    '--inspector-port',
    '0',
  ]
  const child = spawn(wranglerBin, args, {
    cwd: configDir,
    env: {
      ...process.env,
      // Do not inherit a real worker secret from the shell.
      UNSUBSCRIBE_TOKEN_SECRET: secret,
      PAYLOAD_SECRET: 'test-payload-secret-not-for-prod',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let output = ''
  const onData = (chunk) => {
    output += chunk.toString()
  }
  child.stdout.on('data', onData)
  child.stderr.on('data', onData)
  child.output = () => output
  return child
}

function stopWrangler(child) {
  if (!child.pid || child.exitCode !== null) return
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    try {
      child.kill('SIGTERM')
    } catch {
      /* already gone */
    }
  }
}

async function writeConfig(configDir, secretPresent) {
  const vars = {
    DEPLOY_DISPATCH_URL: 'https://example.com/dispatch',
    TURNSTILE_HOSTNAMES: 'localhost,127.0.0.1',
    PAYLOAD_SECRET: 'test-payload-secret-not-for-prod',
  }
  if (secretPresent) vars.UNSUBSCRIBE_TOKEN_SECRET = FAKE_SECRET
  const config = {
    name: 'rinsly-unsub-worker-test',
    main: WORKER,
    compatibility_date: '2025-08-15',
    compatibility_flags: ['nodejs_compat', 'global_fetch_strictly_public'],
    assets: { directory: ASSETS, binding: 'ASSETS' },
    vars,
    d1_databases: [
      {
        binding: 'D1',
        database_name: 'rinsly-unsub-test',
        database_id: '00000000-0000-0000-0000-000000000001',
      },
    ],
    r2_buckets: [
      { binding: 'R2', bucket_name: 'rinsly-unsub-test-r2' },
      { binding: 'LEADLENS_CHECKS', bucket_name: 'rinsly-unsub-test-ll' },
    ],
  }
  await writeFile(path.join(configDir, 'wrangler.json'), `${JSON.stringify(config, null, 2)}\n`)
}


function splitUpDown(source) {
  const upIdx = source.search(/export\s+async\s+function\s+up\b/)
  const downIdx = source.search(/export\s+async\s+function\s+down\b/)
  if (upIdx === -1) return ''
  if (downIdx === -1 || upIdx < downIdx) return source.slice(upIdx, downIdx === -1 ? undefined : downIdx)
  return source.slice(upIdx)
}

async function migrationNamesInOrder() {
  const index = await readFile(path.join(ROOT, 'src/migrations/index.ts'), 'utf8')
  return [...index.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1])
}

/** Apply Payload up() SQL to the local D1 so the locale layout can read `header`. */
async function applyLocalSchema(configDir, persistDir) {
  const names = await migrationNamesInOrder()
  if (names.length === 0) fail('no migrations in src/migrations/index.ts')
  const statements = []
  for (const name of names) {
    const source = await readFile(path.join(ROOT, 'src/migrations', `${name}.ts`), 'utf8')
    statements.push(...extractSqlTemplates(splitUpDown(source)))
  }
  const sqlPath = path.join(configDir, 'schema.sql')
  await writeFile(sqlPath, `${statements.join(';\n')};\n`)
  const wranglerBin = path.join(ROOT, 'node_modules/.bin/wrangler')
  const result = spawn(
    wranglerBin,
    [
      'd1',
      'execute',
      'D1',
      '--local',
      '--yes',
      '--config',
      path.join(configDir, 'wrangler.json'),
      '--persist-to',
      persistDir,
      '--file',
      sqlPath,
    ],
    { cwd: configDir, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  await new Promise((resolve, reject) => {
    result.stdout.on('data', (c) => { output += c.toString() })
    result.stderr.on('data', (c) => { output += c.toString() })
    result.on('error', reject)
    result.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`wrangler d1 execute failed (${code}): ${output.slice(-2000)}`))
    })
  })
  ok(`applied ${names.length} local D1 migrations (${statements.length} SQL templates)`)
}

async function withWorker({ secretPresent }, fn) {
  const { access } = await import('node:fs/promises')
  try {
    await access(WORKER)
  } catch {
    fail(`missing ${WORKER}; run opennextjs-cloudflare build first`)
  }
  const tmp = await mkdtemp(path.join(tmpdir(), 'rinsly-unsub-worker-'))
  const persistDir = path.join(tmp, 'persist')
  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  await writeConfig(tmp, secretPresent)
  await applyLocalSchema(tmp, persistDir)
  const child = startWrangler({
    configDir: tmp,
    persistDir,
    port,
    secret: secretPresent ? FAKE_SECRET : '',
  })
  try {
    await waitForServer(`${origin}/afmelden`, child)
    await fn(origin)
  } catch (err) {
    console.error(child.output().slice(-4000))
    throw err
  } finally {
    stopWrangler(child)
    await new Promise((r) => setTimeout(r, 300))
    await rm(tmp, { recursive: true, force: true })
  }
}

async function request(origin, path, init = {}) {
  const response = await fetch(`${origin}${path}`, {
    redirect: 'manual',
    ...init,
  })
  return response
}

async function run() {
  const validToken = await mintUnsubscribeToken('person@example.com', FAKE_SECRET)

  console.log('======= built worker (fake secret present) =======')
  await withWorker({ secretPresent: true }, async (origin) => {
    const bare = await request(origin, `/afmelden?token=${encodeURIComponent(validToken)}`)
    printHeaders('GET /afmelden?token=', bare)
    if (bare.status !== 307) fail(`GET /afmelden: expected 307, got ${bare.status}`)
    const bareLoc = bare.headers.get('location') ?? ''
    if (!bareLoc.includes('/nl/afmelden?') || !bareLoc.includes(`token=${encodeURIComponent(validToken)}`)) {
      fail(`GET /afmelden: Location should keep /nl/afmelden?token=, got ${bareLoc}`)
    }
    assertUnsubscribeHeaders(bare.headers, 'GET /afmelden 307')
    ok('GET /afmelden returns 307 to /nl/afmelden with the query token')

    const bareSlash = await request(origin, `/afmelden/?token=${encodeURIComponent(validToken)}`)
    printHeaders('GET /afmelden/?token=', bareSlash)
    // OpenNext's middleware handler runs handleTrailingSlashRedirect before
    // user middleware, so this hop is a 308 to /afmelden (query kept) without
    // our headers. The typable /afmelden 307 below is the one that can set them.
    if (bareSlash.status !== 308) {
      fail(`GET /afmelden/: expected OpenNext trailing-slash 308, got ${bareSlash.status}`)
    }
    const slashLoc = bareSlash.headers.get('location') ?? ''
    if (!slashLoc.includes('/afmelden?') || !slashLoc.includes(`token=${encodeURIComponent(validToken)}`)) {
      fail(`GET /afmelden/: Location should keep /afmelden?token=, got ${slashLoc}`)
    }
    if (bareSlash.headers.get('referrer-policy') || bareSlash.headers.get('cache-control')) {
      fail(`GET /afmelden/ 308 unexpectedly has privacy headers: ${headerLine(bareSlash.headers, 'referrer-policy')} ${headerLine(bareSlash.headers, 'cache-control')}`)
    }
    ok('GET /afmelden/ is OpenNext\'s headerless 308 to /afmelden, query preserved')
    const slashFollow = slashLoc.startsWith('http') ? slashLoc : new URL(slashLoc, origin).pathname + new URL(slashLoc, origin).search
    const afterSlash = await request(origin, slashFollow.startsWith('http') ? new URL(slashFollow).pathname + new URL(slashFollow).search : slashFollow)
    printHeaders('GET follow /afmelden/ 308', afterSlash)
    if (afterSlash.status !== 307) fail(`follow /afmelden/ 308: expected 307, got ${afterSlash.status}`)
    assertUnsubscribeHeaders(afterSlash.headers, 'GET /afmelden after /afmelden/ 308')
    ok('The /afmelden hop after the 308 is a 307 with no-referrer and no-store')

    const getBad = await request(origin, `/nl/afmelden?token=${encodeURIComponent(BOGUS)}`)
    printHeaders('GET /nl/afmelden?token=bogus', getBad)
    if (getBad.status !== 400) fail(`GET /nl/afmelden invalid: expected 400, got ${getBad.status}`)
    const getBadBody = await getBad.text()
    if (!getBadBody.includes('contact@rinsly.com')) fail('GET /nl/afmelden 400 body is missing the friendly copy')
    assertUnsubscribeHeaders(getBad.headers, 'GET /nl/afmelden 400')
    ok('GET /nl/afmelden with an invalid token returns 400')

    const oneClickBad = await request(origin, `/nl/afmelden/one-click?token=${encodeURIComponent(BOGUS)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'List-Unsubscribe=One-Click',
    })
    printHeaders('POST /nl/afmelden/one-click invalid', oneClickBad)
    if (oneClickBad.status !== 400) {
      fail(`POST one-click invalid: expected 400, got ${oneClickBad.status}`)
    }
    assertUnsubscribeHeaders(oneClickBad.headers, 'POST one-click 400')
    ok('POST one-click with an invalid token returns 400')

    const oneClickValid = await request(
      origin,
      `/nl/afmelden/one-click?token=${encodeURIComponent(validToken)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      },
    )
    printHeaders('POST /nl/afmelden/one-click valid (store unavailable)', oneClickValid)
    if (oneClickValid.status !== 503) {
      fail(`POST one-click valid: expected 503 (store unavailable), got ${oneClickValid.status}`)
    }
    const unavailableBody = await oneClickValid.text()
    if (!unavailableBody.includes('contact@rinsly.com')) {
      fail('POST one-click 503 body is missing the friendly copy')
    }
    assertUnsubscribeHeaders(oneClickValid.headers, 'POST one-click 503')
    ok('POST one-click with a valid token returns 503 when the store is unavailable')
  })

  console.log('======= built worker (fake secret absent) =======')
  await withWorker({ secretPresent: false }, async (origin) => {
    const getNoSecret = await request(origin, `/nl/afmelden?token=${encodeURIComponent(validToken)}`)
    printHeaders('GET /nl/afmelden (no secret)', getNoSecret)
    if (getNoSecret.status !== 503) {
      fail(`GET /nl/afmelden without a secret: expected 503, got ${getNoSecret.status}`)
    }
    const body = await getNoSecret.text()
    if (!body.includes('contact@rinsly.com')) {
      fail('GET /nl/afmelden 503 body is missing the friendly copy')
    }
    assertUnsubscribeHeaders(getNoSecret.headers, 'GET /nl/afmelden 503')
    ok('GET /nl/afmelden returns 503 when the secret is missing')
  })

  console.log('ALL PASSED')
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
