
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSession,
} from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'review-images';

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const reviewId = request.nextUrl.searchParams.get('id');

  if (
    !reviewId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      reviewId
    )
  ) {
    return errorResponse('후기 ID가 올바르지 않습니다.', 400);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return errorResponse('데이터베이스 설정 오류', 503);
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: review, error } = await supabase
    .from('customer_reviews')
    .select('image_path,is_published')
    .eq('id', reviewId)
    .maybeSingle();

  if (error) {
    return errorResponse('사진 조회에 실패했습니다.', 500);
  }

  if (!review || !review.image_path) {
    return errorResponse('사진을 찾을 수 없습니다.', 404);
  }

  const session = request.cookies.get(
    ADMIN_COOKIE_NAME
  )?.value;

  const isAdmin = verifyAdminSession(session);

  if (!review.is_published && !isAdmin) {
    return errorResponse('사진을 찾을 수 없습니다.', 404);
  }

  const imagePath = review.image_path;

  if (
    !/^reviews\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(
      imagePath
    )
  ) {
    return errorResponse('사진 경로가 올바르지 않습니다.', 400);
  }

  const { data, error: downloadError } =
    await supabase.storage
      .from(BUCKET)
      .download(imagePath);

  if (downloadError || !data) {
    return errorResponse('사진을 불러오지 못했습니다.', 404);
  }

  const bytes = await data.arrayBuffer();

  const extension = imagePath.split('.').pop();

  const contentType =
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
