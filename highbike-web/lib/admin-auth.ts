
import {
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

export const ADMIN_COOKIE_NAME =
  'highbike_admin_session';

export function verifyAdminSession(
  cookieValue: string | undefined
): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32 || !cookieValue) {
    return false;
  }

  const parts = cookieValue.split('.');

  if (parts.length !== 2) {
    return false;
  }

  const [payload, suppliedSignature] = parts;

  if (
    !/^\d{10,13}$/.test(payload) ||
    !/^[a-f0-9]{64}$/i.test(suppliedSignature)
  ) {
    return false;
  }

  const expiresAt = Number(payload);
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + 60 * 60 * 8
  ) {
    return false;
  }

  const expectedSignature = createHmac(
    'sha256',
    secret
  )
    .update(payload)
    .digest();

  const receivedSignature = Buffer.from(
    suppliedSignature,
    'hex'
  );

  if (
    receivedSignature.length !==
    expectedSignature.length
  ) {
    return false;
  }

  return timingSafeEqual(
    receivedSignature,
    expectedSignature
  );
}
