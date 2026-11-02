export interface EmailSendBinding {
  send(message: unknown): Promise<unknown>
}

export function createCloudflareEmailSendingAdapter(opts: {
  defaultFromAddress: string
  defaultFromName: string
  getSendBinding: () => Promise<EmailSendBinding | null>
}): unknown
