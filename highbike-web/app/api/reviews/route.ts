
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: '후기 서비스 설정 오류' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  try {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase
      .from('customer_reviews')
      .select(
        'id,model_name,rating,review_text,sort_order,created_at'
      )
      .eq('is_published', true)
      .not('image_path', 'is', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: '고객 후기를 불러오지 못했습니다.' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    return NextResponse.json(
      { reviews: data ?? [] },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: '후기 조회 중 오류가 발생했습니다.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
