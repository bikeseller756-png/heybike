
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSession,
} from '../../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'review-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get(
    ADMIN_COOKIE_NAME
  )?.value;

  if (!verifyAdminSession(session)) {
    return errorResponse('관리자 로그인이 필요합니다.', 401);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return errorResponse('데이터베이스 설정 오류', 503);
  }

  let file: File;

  try {
    const formData = await request.formData();
    const uploaded = formData.get('file');

    if (!(uploaded instanceof File)) {
      return errorResponse(
        '업로드할 사진을 선택해 주세요.',
        400
      );
    }

    file = uploaded;
  } catch {
    return errorResponse(
      '파일 업로드 요청을 확인해 주세요.',
      400
    );
  }

  if (
    file.size === 0 ||
    file.size > MAX_FILE_SIZE
  ) {
    return errorResponse(
      '사진은 5MB 이하로 업로드해 주세요.',
      400
    );
  }

  const extension = IMAGE_TYPES[file.type];

  if (!extension) {
    return errorResponse(
      'JPG, PNG, WEBP 사진만 업로드할 수 있습니다.',
      400
    );
  }

  const bytes = new Uint8Array(
    await file.arrayBuffer()
  );

  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';

  const validImage =
    (file.type === 'image/jpeg' && isJpeg) ||
    (file.type === 'image/png' && isPng) ||
    (file.type === 'image/webp' && isWebp);

  if (!validImage) {
    return errorResponse(
      '사진 파일 형식이 올바르지 않습니다.',
      400
    );
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const imagePath = `reviews/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    });

  if (error) {
    return errorResponse(
      '사진 저장에 실패했습니다.',
      500
    );
  }

  return NextResponse.json(
    {
      success: true,
      image_path: imagePath,
    },
    {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
