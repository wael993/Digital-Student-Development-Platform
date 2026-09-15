import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';

export type FcmSendInput = {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
};

export type FcmSendResult = {
  successTokens: string[];
  invalidTokens: string[];
  retryableTokens: string[];
};

export type FcmSender = (input: FcmSendInput) => Promise<FcmSendResult>;

const INVALID_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

let sender: FcmSender = defaultFcmSender;

export function setFcmSender(next: FcmSender): void {
  sender = next;
}

export function resetFcmSender(): void {
  sender = defaultFcmSender;
}

export function sendFcm(input: FcmSendInput): Promise<FcmSendResult> {
  return sender(input);
}

async function defaultFcmSender(input: FcmSendInput): Promise<FcmSendResult> {
  if (input.tokens.length === 0) {
    return { successTokens: [], invalidTokens: [], retryableTokens: [] };
  }
  const messaging = await loadMessaging();
  if (!messaging) {
    logger.warn('FCM credentials missing; push delivery skipped');
    return { successTokens: [], invalidTokens: [], retryableTokens: [] };
  }

  const response = await messaging.sendEachForMulticast({
    tokens: input.tokens,
    notification: { title: input.title, body: input.body },
    data: input.data,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });

  const successTokens: string[] = [];
  const invalidTokens: string[] = [];
  const retryableTokens: string[] = [];
  response.responses.forEach((item, index) => {
    const token = input.tokens[index];
    if (item.success) {
      successTokens.push(token);
      return;
    }
    const code = item.error?.code ?? '';
    if (INVALID_CODES.has(code)) {
      invalidTokens.push(token);
      return;
    }
    retryableTokens.push(token);
  });
  return { successTokens, invalidTokens, retryableTokens };
}

async function loadMessaging() {
  if (!env.fcmProjectId || !env.fcmClientEmail || !env.fcmPrivateKey) {
    return null;
  }
  const { cert, getApps, initializeApp } = await import('firebase-admin/app');
  const { getMessaging } = await import('firebase-admin/messaging');
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: env.fcmProjectId,
        clientEmail: env.fcmClientEmail,
        privateKey: env.fcmPrivateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getMessaging();
}
