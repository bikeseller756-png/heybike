
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSession,
} from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReviewInput = {
  model_name?: unknown;
  rating?: unknown;
  review_text?: unknown;
  image_path?: unknown;
  is_published?: unknown;
  sort_order?: unknown;
};

function responseError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

function authorized(request: NextRequest) {
  const session = request.cookies.get(
    ADMIN_COOKIE_NAME
  )?.value;

  return verifyAdminSession(session);
}

function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function parseReview(body: ReviewInput) {
  const model_name =
    typeof body.model_name === 'string'
      ? body.model_name.trim()
      : '';

  const review_text =
    typeof body.review_text === 'string'
      ? body.review_text.trim()
      : '';

  const rating = body.rating;

  const image_path =
    typeof body.image_path === 'string'
      ? body.image_path.trim()
      : '';

  const is_published = body.is_published;
  const sort_order = body.sort_order;

  if (!model_name || model_name.length > 100) {
    throw new Error('차량명을 1~100자로 입력해 주세요.');
  }

  if (!review_text || review_text.length > 2000) {
    throw new Error('후기 내용을 1~2000자로 입력해 주세요.');
  }

  if (
    typeof rating !== 'number' ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error('별점은 1~5점으로 설정해 주세요.');
  }

  if (
    image_path &&
    (
      image_path.length > 500 ||
      !/^reviews\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(
        image_path
      )
    )
  ) {
    throw new Error('올바르지 않은 이미지 경로입니다.');
  }

  if (
    is_published !== undefined &&
    typeof is_published !== 'boolean'
  ) {
    throw new Error('공개 설정이 올바르지 않습니다.');
  }

  if (
    sort_order !== undefined &&
    (
      typeof sort_order !== 'number' ||
      !Number.isInteger(sort_order) ||
      sort_order < 0 ||
      sort_order > 100000
    )
  ) {
    throw new Error('노출 순서가 올바르지 않습니다.');
  }

  return {
    model_name,
    rating,
    review_text,
    image_path: image_path || null,
    is_published:
      typeof is_published === 'boolean'
        ? is_published
        : false,
    sort_order:
      typeof sort_order === 'number'
        ? sort_order
        : 0,
  };
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return responseError('관리자 로그인이 필요합니다.', 401);
  }

  const supabase = database();

  if (!supabase) {
    return responseError('데이터베이스 설정 오류', 503);
  }

  const { data, error } = await supabase
    .from('customer_reviews')
    .select(
      'id,model_name,rating,review_text,image_path,is_published,sort_order,created_at,updated_at'
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return responseError('후기 목록을 불러오지 못했습니다.', 500);
  }

  return NextResponse.json(
    { reviews: data ?? [] },
    {
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return responseError('관리자 로그인이 필요합니다.', 401);
  }

  const supabase = database();

  if (!supabase) {
    return responseError('데이터베이스 설정 오류', 503);
  }

  let input;

  try {
    const body = (await request.json()) as ReviewInput;
    input = parseReview(body);
  } catch (error) {
    return responseError(
      error instanceof Error
        ? error.message
        : '입력 정보를 확인해 주세요.',
      400
    );
  }

  const { data, error } = await supabase
    .from('customer_reviews')
    .insert(input)
    .select()
    .single();

  if (error) {
    return responseError('후기 등록에 실패했습니다.', 500);
  }

  return NextResponse.json(
    { review: data },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) {
    return responseError('관리자 로그인이 필요합니다.', 401);
  }

  const supabase = database();

  if (!supabase) {
    return responseError('데이터베이스 설정 오류', 503);
  }

  let id: string;
  let input;

  try {
    const body = await request.json();

    if (
      typeof body.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.id
      )
    ) {
      return responseError('후기 ID가 올바르지 않습니다.', 400);
    }

    id = body.id;
    input = parseReview(body);
  } catch (error) {
    return responseError(
      error instanceof Error
        ? error.message
        : '입력 정보를 확인해 주세요.',
      400
    );
  }

  const { data, error } = await supabase
    .from('customer_reviews')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    return responseError('후기 수정에 실패했습니다.', 500);
  }

  if (!data) {
    return responseError('해당 후기를 찾을 수 없습니다.', 404);
  }

  return NextResponse.json({ review: data });
}

export async function DELETE(request: NextRequest) {
  if (!authorized(request)) {
    return responseError('관리자 로그인이 필요합니다.', 401);
  }

  const supabase = database();

  if (!supabase) {
    return responseError('데이터베이스 설정 오류', 503);
  }

  let id: string;

  try {
    const body = await request.json();

    if (
      typeof body.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.id
      )
    ) {
      return responseError('후기 ID가 올바르지 않습니다.', 400);
    }

    id = body.id;
  } catch {
    return responseError('요청 정보를 확인해 주세요.', 400);
  }

  const { data, error } = await supabase
    .from('customer_reviews')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return responseError('후기 삭제에 실패했습니다.', 500);
  }

  if (!data) {
    return responseError('해당 후기를 찾을 수 없습니다.', 404);
  }

  return NextResponse.json({ success: true });
}
