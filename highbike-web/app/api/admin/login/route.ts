
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createHmac,
  timingSafeEqual,
  scryptSync,
} from 'node:crypto';

export const runtime = 'nodejs';

const COOKIE_NAME = 'highbike_admin_session';
const SESSION_SECONDS = 60 * 60 * 8;

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

function verifyPassword(
  supplied: string,
  stored: string
): boolean {
  const parts = stored.split(':');

  if (
    parts.length !== 3 ||
    parts[0] !== 'scrypt' ||
    !/^[a-f0-9]{32,128}$/i.test(parts[1]) ||
    !/^[a-f0-9]{128}$/i.test(parts[2])
  ) {
    return false;
  }

  const calculated = scryptSync(
    supplied,
    parts[1],
    64
  );

  const expected = Buffer.from(parts[2], 'hex');

  return timingSafeEqual(calculated, expected);
}

export async function POST(request: NextRequest) {
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_SESSION_SECRET;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (
    !storedHash ||
    !secret ||
    secret.length < 32 ||
    !url ||
    !key
  ) {
    return fail('관리자 인증 설정이 필요합니다.', 503);
  }

  const origin = request.headers.get('origin');

  if (origin && origin !== request.nextUrl.origin) {
    return fail('허용되지 않은 요청입니다.', 403);
  }

  let password = '';

  try {
    const body = await request.json();

    password =
      typeof body.password === 'string'
        ? body.password
        : '';
  } catch {
    return fail('요청 형식이 올바르지 않습니다.', 400);
  }

  if (!password || password.length > 256) {
    return fail('비밀번호를 확인해 주세요.', 400);
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

  const ipHash = createHmac('sha256', secret)
    .update(ip)
    .digest('hex');

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: limitRows, error: limitError } =
    await supabase.rpc('check_admin_login_limit', {
      p_key_hash: ipHash,
    });

  if (limitError || !Array.isArray(limitRows)) {
    return fail('인증 서비스를 확인할 수 없습니다.', 503);
  }

  const limit = limitRows[0];

  if (!limit?.allowed) {
    return fail(
      '로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.',
      429
    );
  }

  let valid = false;

  try {
    valid = verifyPassword(password, storedHash);
  } catch {
    return fail('인증 처리 중 오류가 발생했습니다.', 503);
  }

  if (!valid) {
    const { error: recordError } = await supabase.rpc(
      'record_admin_login_failure',
      { p_key_hash: ipHash }
    );

    if (recordError) {
      return fail('인증 서비스를 확인할 수 없습니다.', 503);
    }

    return fail('비밀번호가 올바르지 않습니다.', 401);
  }

  const expiresAt =
    Math.floor(Date.now() / 1000) + SESSION_SECONDS;

  const payload = String(expiresAt);

  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );

  response.cookies.set(
    COOKIE_NAME,
    `${payload}.${signature}`,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_SECONDS,
    }
  );

  return response;
}
