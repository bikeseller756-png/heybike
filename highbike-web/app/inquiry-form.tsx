
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  getAdvertisingConsent,
  saveAdvertisingConsent,
  CONSENT_EVENT,
} from './meta-consent';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
        }
      ) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
  }
}

const enabled =
  process.env.NEXT_PUBLIC_INQUIRIES_ENABLED === 'true';

const siteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

const UTM_STORAGE_KEY = 'highbike_ad_attribution';

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
] as const;

type UtmData = Record<(typeof UTM_KEYS)[number], string>;

function readCurrentUtm(): UtmData {
  const query = new URLSearchParams(window.location.search);

  return {
    utm_source: query.get('utm_source') || '',
    utm_medium: query.get('utm_medium') || '',
    utm_campaign: query.get('utm_campaign') || '',
  };
}

function saveUtmFromUrl() {
  try {
    const current = readCurrentUtm();

    if (current.utm_source) {
      sessionStorage.setItem(
        UTM_STORAGE_KEY,
        JSON.stringify(current)
      );
    }
  } catch {
    // 저장소 접근 실패는 접수에 영향을 주지 않음
  }
}

function getUtm(): UtmData {
  const current = readCurrentUtm();

  if (current.utm_source) return current;

  try {
    const saved = JSON.parse(
      sessionStorage.getItem(UTM_STORAGE_KEY) || '{}'
    ) as Partial<UtmData>;

    return {
      utm_source: saved.utm_source || '',
      utm_medium: saved.utm_medium || '',
      utm_campaign: saved.utm_campaign || '',
    };
  } catch {
    return current;
  }
}

function trackSuccessfulLead() {
  if (getAdvertisingConsent() !== 'accepted') return;

  try {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {
        content_name: 'Motorcycle Buyback Inquiry',
      });
    }
  } catch {
    // 광고 오류는 접수에 영향을 주지 않음
  }

  try {
    if (typeof window.karrotPixel?.track === 'function') {
      window.karrotPixel.track('Lead');
    }
  } catch {
    // 광고 오류는 접수에 영향을 주지 않음
  }
}

export default function InquiryForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [advertisingConsent, setAdvertisingConsent] =
    useState(false);
  const [token, setToken] = useState('');

  const form = useRef<HTMLFormElement>(null);
  const captcha = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    saveUtmFromUrl();

    const syncConsent = () => {
      setAdvertisingConsent(
        getAdvertisingConsent() === 'accepted'
      );
    };

    syncConsent();

    window.addEventListener(CONSENT_EVENT, syncConsent);

    return () => {
      window.removeEventListener(
        CONSENT_EVENT,
        syncConsent
      );
    };
  }, []);

  useEffect(() => {
    if (!enabled || !siteKey || !captcha.current) return;

    let active = true;

    const renderWidget = () => {
      if (
        !active ||
        !captcha.current ||
        !window.turnstile ||
        widgetId.current !== null
      ) {
        return;
      }

      widgetId.current = window.turnstile.render(
        captcha.current,
        {
          sitekey: siteKey,
          callback: setToken,
          'expired-callback': () => setToken(''),
        }
      );
    };

    const existingScript = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
    ) as HTMLScriptElement | null;

    let script = existingScript;
    let createdScript = false;

    if (!script) {
      script = document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      document.head.appendChild(script);
      createdScript = true;
    }

    script.addEventListener('load', renderWidget);
    renderWidget();

    return () => {
      active = false;
      script?.removeEventListener('load', renderWidget);

      if (
        widgetId.current !== null &&
        window.turnstile
      ) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }

      if (createdScript) script?.remove();
    };
  }, []);

  function updateAdvertisingConsent(value: boolean) {
    setAdvertisingConsent(value);

    saveAdvertisingConsent(
      value ? 'accepted' : 'rejected'
    );
  }

  function updateAllConsent(value: boolean) {
    setPrivacyConsent(value);
    updateAdvertisingConsent(value);
  }

  async function submit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!form.current || !privacyConsent || !token || busy) {
      return;
    }

    setBusy(true);
    setMessage('');
    setOk(false);

    try {
      const data = new FormData(form.current);

      // 삭제된 항목은 서버 호환성을 위해 빈 값 전송
      data.set('model_year', '');
      data.set('mileage_km', '');
      data.set('condition_notes', '');

      data.set('consent', 'true');
      data.set('turnstileToken', token);

      const utm = getUtm();

      for (const key of UTM_KEYS) {
        data.set(key, utm[key]);
      }

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error || '신청을 처리하지 못했습니다.'
        );
      }

      if (advertisingConsent) {
        trackSuccessfulLead();
      }

      setOk(true);
      setMessage(
        '견적 신청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.'
      );

      form.current.reset();
      setPrivacyConsent(false);
      setToken('');

      if (
        window.turnstile &&
        widgetId.current !== null
      ) {
        window.turnstile.reset(widgetId.current);
      }
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : '잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (!enabled || !siteKey) {
    return (
      <div className="formPanel">
        <div className="notice">
          견적 신청 시스템 연결 및 개인정보 안내 설정을
          확인 중입니다. 현재 온라인 접수는
          비활성화되어 있습니다.
        </div>
      </div>
    );
  }

  return (
    <form
      ref={form}
      className="formPanel"
      onSubmit={submit}
    >
      <div className="fields">
        <label>
          고객명 *
          <input
            name="customer_name"
            required
            maxLength={60}
            autoComplete="name"
            placeholder="성함"
          />
        </label>

        <label>
          연락처 *
          <input
            name="phone"
            required
            maxLength={20}
            inputMode="tel"
            autoComplete="tel"
            placeholder="010-0000-0000"
          />
        </label>

        <label>
          제조사
          <input
            name="manufacturer"
            maxLength={80}
            placeholder="예: 혼다"
          />
        </label>

        <label>
          모델명 *
          <input
            name="model"
            required
            maxLength={100}
            placeholder="예: PCX125"
          />
        </label>

        <label>
          차량 소재지
          <input
            name="location"
            maxLength={120}
            placeholder="예: 인천 서구"
          />
        </label>
      </div>

      <div
        style={{
          marginTop: 20,
          marginBottom: 18,
          padding: 16,
          border: '1px solid #d1d5db',
          borderRadius: 12,
          background: '#fff',
          color: '#111827',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 800,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={
              privacyConsent && advertisingConsent
            }
            onChange={(e) =>
              updateAllConsent(e.target.checked)
            }
            style={{
              width: 20,
              height: 20,
              flexShrink: 0,
            }}
          />
          전체 동의하기
        </label>

        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            marginTop: 14,
            paddingTop: 14,
            display: 'grid',
            gap: 14,
          }}
        >
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) =>
                  setPrivacyConsent(e.target.checked)
                }
                required
                style={{
                  width: 18,
                  height: 18,
                  flexShrink: 0,
                }}
              />
              <span>
                <strong>[필수]</strong>{' '}
                견적 상담을 위한 개인정보
                수집·이용 동의
              </span>
            </label>

            <div
              style={{
                paddingLeft: 28,
                marginTop: 5,
                fontSize: 12,
              }}
            >
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                개인정보 처리방침 내용 확인
              </Link>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={advertisingConsent}
                onChange={(e) =>
                  updateAdvertisingConsent(
                    e.target.checked
                  )
                }
                style={{
                  width: 18,
                  height: 18,
                  flexShrink: 0,
                }}
              />
              <span>
                <strong>[선택]</strong>{' '}
                Meta·당근 광고 성과 측정을 위한
                추적 동의
              </span>
            </label>

            <p
              style={{
                paddingLeft: 28,
                margin: '5px 0 0',
                fontSize: 12,
                lineHeight: 1.7,
                color: '#6b7280',
              }}
            >
              동의 시 홈페이지 방문 및 견적 신청
              완료 이벤트가 Meta와 당근에 전송될
              수 있습니다. 동의하지 않아도 견적
              신청이 가능합니다. 동의는 화면
              왼쪽 아래 광고 추적 설정에서
              변경할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div ref={captcha} className="captcha" />

      <button
        className="btn primary full"
        disabled={!privacyConsent || !token || busy}
        type="submit"
      >
        {busy ? '접수 중...' : '무료 견적 신청'}
      </button>

      {message && (
        <p
          role="status"
          className={ok ? 'formSuccess' : 'formError'}
        >
          {message}
        </p>
      )}
    </form>
  );
}
