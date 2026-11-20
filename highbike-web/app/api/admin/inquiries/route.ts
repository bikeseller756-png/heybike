
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSession,
} from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = request.cookies.get(
    ADMIN_COOKIE_NAME
  )?.value;

  if (!verifyAdminSession(session)) {
    return NextResponse.json(
      { error: '관리자 로그인이 필요합니다.' },
      {
        status: 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: '데이터베이스 설정 오류' },
      { status: 503 }
    );
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('purchase_inquiries')
    .select(
      'id,created_at,customer_name,phone,manufacturer,model,model_year,mileage_km,location,condition_notes,status,utm_source,utm_medium,utm_campaign'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: '견적 내역을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { inquiries: data ?? [] },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  );
}
