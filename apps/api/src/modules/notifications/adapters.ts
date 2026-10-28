/**
 * Push / SMS provider interfaces — architecture-ready stubs.
 * No Twilio / FCM keys required for MVP.
 */

export interface PushMessage {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SmsMessage {
  to: string;
  body: string;
}

export interface PushAdapter {
  send(message: PushMessage): Promise<{ ok: boolean; providerResponse?: string }>;
}

export interface SmsAdapter {
  send(message: SmsMessage): Promise<{ ok: boolean; providerResponse?: string }>;
}

/** No-op push — logs in non-production only */
export class NoopPushAdapter implements PushAdapter {
  async send(message: PushMessage): Promise<{ ok: boolean; providerResponse?: string }> {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV PUSH] userId=${message.userId} title="${message.title}"`);
    }
    return { ok: true, providerResponse: 'noop' };
  }
}

/** No-op SMS — never logs full body in production */
export class NoopSmsAdapter implements SmsAdapter {
  async send(message: SmsMessage): Promise<{ ok: boolean; providerResponse?: string }> {
    if (process.env.NODE_ENV !== 'production') {
      const hint = message.body.slice(0, 40);
      console.log(`[DEV SMS] to=${message.to} bodyHint="${hint}..."`);
    }
    return { ok: true, providerResponse: 'noop' };
  }
}

let pushAdapter: PushAdapter = new NoopPushAdapter();
let smsAdapter: SmsAdapter = new NoopSmsAdapter();

export function setPushAdapter(adapter: PushAdapter): void {
  pushAdapter = adapter;
}

export function setSmsAdapter(adapter: SmsAdapter): void {
  smsAdapter = adapter;
}

export function getPushAdapter(): PushAdapter {
  return pushAdapter;
}

export function getSmsAdapter(): SmsAdapter {
  return smsAdapter;
}
