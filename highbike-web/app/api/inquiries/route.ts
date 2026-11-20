
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

const error = (message: string, status = 400) =>
  NextResponse.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );

const clean = (v: FormDataEntryValue | null, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const imageTypes: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

function validImage(bytes: Uint8Array, mime: string) {
  const magic = imageTypes[mime];

  if (!magic || !magic.every((x, i) => bytes[i] === x)) {
    return false;
  }

  if (mime === 'image/webp') {
    return [0x57, 0x45, 0x42, 0x50].every(
      (x, i) => bytes[8 + i] === x
    );
  }

  return true;
}

type InquiryNotification = {
  id: string;
  customer_name: string;
  phone: string;
  manufacturer: string;
  model: string;
  model_year: number | null;
  mileage_km: number | null;
  location: string;
};

// 가비아 문자 서버를 통한 문자 발송
async function sendPpurioSMS(data: InquiryNotification) {
  const url = process.env.SMS_SERVER_URL;
  const secret = process.env.SMS_SERVER_SECRET;

  if (!url || !secret) {
    console.error('SMS server configuration is incomplete');
    return;
  }

  try {
    const response = await fetch(
      `${url.replace(/\/+$/, '')}/send-sms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sms-secret': secret,
        },
        body: JSON.stringify({
          name: data.customer_name,
          phone: data.phone,
          manufacturer: data.manufacturer,
          model: data.model,
          model_year: data.model_year,
          mileage_km: data.mileage_km,
          location: data.location,
        }),
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(
        'SMS server request failed',
        response.status
      );
      return;
    }

    console.info('SMS server request accepted');
  } catch (err) {
    console.error(
      'SMS server connection error',
      err instanceof Error ? err.name : 'UnknownError'
    );
  }
}

export async function POST(request: NextRequest) {
  if (
    process.env.NEXT_PUBLIC_INQUIRIES_ENABLED !== 'true' ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SECRET_KEY ||
    !process.env.TURNSTILE_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    !process.env.PRIVACY_CONTACT ||
    !process.env.PRIVACY_OPERATOR
  ) {
    return error('접수 기능이 아직 준비 중입니다.', 503);
  }

  const length = Number(
    request.headers.get('content-length') || 0
  );

  if (length > 28 * 1024 * 1024) {
    return error('첨부파일 전체 크기가 너무 큽니다.', 413);
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return error('요청 형식이 올바르지 않습니다.');
  }

  if (clean(form.get('website'), 100)) {
    return error('접수가 완료되었습니다.');
  }

  if (clean(form.get('consent'), 10) !== 'true') {
    return error('개인정보 수집·이용 동의가 필요합니다.');
  }

  const customer_name = clean(form.get('customer_name'), 60);
  const phone = clean(form.get('phone'), 20);
  const model = clean(form.get('model'), 100);

  if (
    !customer_name ||
    !model ||
    !/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone)
  ) {
    return error(
      '고객명, 모델명, 연락처를 확인해 주세요.'
    );
  }

  const yearText = clean(form.get('model_year'), 8);
  const kmText = clean(form.get('mileage_km'), 10);

  const model_year = yearText ? Number(yearText) : null;
  const mileage_km = kmText ? Number(kmText) : null;

  if (
    (model_year !== null &&
      (!Number.isInteger(model_year) ||
        model_year < 1950 ||
        model_year > 2100)) ||
    (mileage_km !== null &&
      (!Number.isInteger(mileage_km) ||
        mileage_km < 0 ||
        mileage_km > 9999999))
  ) {
    return error(
      '연식 또는 주행거리를 확인해 주세요.'
    );
  }

  const captcha = clean(form.get('turnstileToken'), 3000);

  if (!captcha) {
    return error('보안 인증을 완료해 주세요.');
  }

  let verified = false;

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: captcha,
        }),
        signal: AbortSignal.timeout(7000),
      }
    );

    const result = await response.json();
    verified = result.success === true;
  } catch {
    return error(
      '보안 인증 서비스에 연결할 수 없습니다.',
      503
    );
  }

  if (!verified) {
    return error(
      '보안 인증에 실패했습니다. 다시 시도해 주세요.',
      403
    );
  }

  const files = form
    .getAll('photos')
    .filter(
      (x): x is File =>
        x instanceof File && x.size > 0
    );

  if (files.length > 5) {
    return error(
      '사진은 최대 5장까지 첨부할 수 있습니다.'
    );
  }

  if (
    files.reduce((n, f) => n + f.size, 0) >
    25 * 1024 * 1024
  ) {
    return error(
      '사진 전체 크기는 25MB 이하로 첨부해 주세요.'
    );
  }

  const prepared: {
    buffer: Uint8Array;
    type: string;
    ext: string;
  }[] = [];

  for (const file of files) {
    if (
      file.size > 10 * 1024 * 1024 ||
      !imageTypes[file.type]
    ) {
      return error(
        '사진 형식 또는 크기를 확인해 주세요.'
      );
    }

    const buffer = new Uint8Array(
      await file.arrayBuffer()
    );

    if (!validImage(buffer, file.type)) {
      return error(
        '올바른 이미지 파일만 첨부할 수 있습니다.'
      );
    }

    prepared.push({
      buffer,
      type: file.type,
      ext:
        file.type === 'image/jpeg'
          ? 'jpg'
          : file.type === 'image/png'
          ? 'png'
          : 'webp',
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const id = randomUUID();
  const paths: string[] = [];

  const cleanup = async () => {
    if (paths.length) {
      await supabase.storage
        .from('motorcycle-photos')
        .remove(paths);
    }
  };

  try {
    for (let i = 0; i < prepared.length; i++) {
      const file = prepared[i];

      const path = `${id}/${randomUUID()}.${file.ext}`;

      const { error: uploadError } =
        await supabase.storage
          .from('motorcycle-photos')
          .upload(path, file.buffer, {
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        await cleanup();

        return error(
          '사진 업로드에 실패했습니다. 다시 시도해 주세요.',
          503
        );
      }

      paths.push(path);
    }

    const manufacturer =
      clean(form.get('manufacturer'), 80) || null;

    const location =
      clean(form.get('location'), 120) || null;

    const { error: insertError } = await supabase
      .from('purchase_inquiries')
      .insert({
        id,
        customer_name,
        phone,
        model,
        manufacturer,
        model_year,
        mileage_km,
        location,
        condition_notes:
          clean(form.get('condition_notes'), 2000) || null,
        photo_paths: paths,
        utm_source:
          clean(form.get('utm_source'), 100) || null,
        utm_medium:
          clean(form.get('utm_medium'), 100) || null,
        utm_campaign:
          clean(form.get('utm_campaign'), 100) || null,
      });

    if (insertError) {
      console.error(
        'Inquiry database insert failed',
        insertError.code
      );

      await cleanup();

      return error(
        '접수 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        503
      );
    }

    // DB 저장 성공 후 가비아 서버로 문자 발송 요청
    // 문자 발송 실패 시에도 견적 접수는 유지
    await sendPpurioSMS({
      id,
      customer_name,
      phone,
      manufacturer: manufacturer || '',
      model,
      model_year,
      mileage_km,
      location: location || '',
    });

    return NextResponse.json(
      { ok: true },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch {
    await cleanup();

    return error(
      '서버 처리 중 문제가 발생했습니다.',
      503
    );
  }
}
