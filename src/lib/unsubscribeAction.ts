'use server'

import { getBindings } from './bindings'
import { readWorkerSecrets } from './env'
import { handleUnsubscribeRequest } from './unsubscribeRequest'
import { UnavailableUnsubscribeStore } from './unsubscribeStore'
import type { UnsubscribeView } from './unsubscribePage'

export async function confirmUnsubscribeAction(formData: FormData): Promise<UnsubscribeView> {
  const locale = formData.get('locale') === 'en' ? 'en' : 'nl'
  const rawToken = formData.get('token')
  const token = typeof rawToken === 'string' ? rawToken : ''
  let secret = ''
  try {
    const env = await getBindings()
    secret = readWorkerSecrets(env).UNSUBSCRIBE_TOKEN_SECRET ?? ''
  } catch {
    secret = ''
  }
  const result = await handleUnsubscribeRequest({
    method: 'POST',
    token: '',
    locale,
    body: `token=${encodeURIComponent(token)}&confirm=1`,
    contentType: 'application/x-www-form-urlencoded',
    secret,
    store: new UnavailableUnsubscribeStore(),
  })
  return result.view
}
