
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: '허용되지 않은 요청입니다.' },
      { status: 403 }
    );
  }

  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );

  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
