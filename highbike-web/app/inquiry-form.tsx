
'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
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
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
        }
      ) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
    fbq?: (...args: unknown[]) => void;
    karrotPixel?: {
      track?: (event: string) => void;
    };
  }
}

const enabled =
  process.env.NEXT_PUBLIC_INQUIRIES_ENABLED === 'true';

const siteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

const canSubmit = enabled && Boolean(siteKey);

const UTM_STORAGE_KEY = 'heybike_ad_attribution';

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

    if (
      current.utm_source ||
      current.utm_medium ||
      current.utm_campaign
    ) {
      sessionStorage.setItem(
        UTM_STORAGE_KEY,
        JSON.stringify(current)
      );
    }
  } catch {
    // 광고 유입정보 저장 실패는 접수에 영향을 주지 않습니다.
  }
}

function getUtm(): UtmData {
  const current = readCurrentUtm();

  if (
    current.utm_source ||
    current.utm_medium ||
    current.utm_campaign
  ) {
    return current;
  }

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
  if (getAdvertisingConsent() !== 'accepted') {
    return;
  }

  try {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {
        content_name: 'HEYBIKE Motorcycle Buyback Inquiry',
      });
    }
  } catch {
    // Meta 오류는 접수에 영향을 주지 않습니다.
  }

  try {
    if (
      typeof window.karrotPixel?.track === 'function'
    ) {
      window.karrotPixel.track('Lead');
    }
  } catch {
    // 당근 광고 오류는 접수에 영향을 주지 않습니다.
  }
}

export default function InquiryForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState(false);

  const [privacyConsent, setPrivacyConsent] =
    useState(false);

  const [advertisingConsent, setAdvertisingConsent] =
    useState(false);

  const [token, setToken] = useState('');

  const formRef = useRef<HTMLFormElement>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canSubmit) return;

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
    if (!canSubmit || !captchaRef.current) {
      return;
    }

    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null =
      null;

    const renderWidget = () => {
      if (!active || !captchaRef.current) return;

      if (!window.turnstile) {
        retryTimer = setTimeout(renderWidget, 150);
        return;
      }

      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = window.turnstile.render(
        captchaRef.current,
        {
          sitekey: siteKey,
          callback: (value) => setToken(value),
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken(''),
        }
      );
    };

    const scriptUrl =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

    let script = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', renderWidget);
    renderWidget();

    return () => {
      active = false;

      script?.removeEventListener(
        'load',
        renderWidget
      );

      if (retryTimer !== null) {
        clearTimeout(retryTimer);
      }

      if (
        widgetIdRef.current !== null &&
        window.turnstile
      ) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  function updateAdvertisingConsent(value: boolean) {
    if (!canSubmit) return;

    setAdvertisingConsent(value);

    saveAdvertisingConsent(
      value ? 'accepted' : 'rejected'
    );
  }

  function updateAllConsent(value: boolean) {
    if (!canSubmit) return;

    setPrivacyConsent(value);
    updateAdvertisingConsent(value);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // 비활성화 상태에서는 API 요청을 실행하지 않습니다.
    if (!canSubmit) {
      return;
    }

    if (
      !formRef.current ||
      !privacyConsent ||
      !token ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setMessage('');
    setOk(false);

    try {
      const data = new FormData(formRef.current);

      // 기존 서버 API와 호환되는 빈 항목입니다.
      data.set('model_year', '');
      data.set('mileage_km', '');
      data.set('condition_notes', '');

      data.set('consent', 'true');
      data.set('turnstileToken', token);

      const utm = getUtm();

      for (const key of UTM_KEYS) {
        data.set(key, utm[key]);
      }

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        body: data,
        credentials: 'same-origin',
        cache: 'no-store',
      });

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            '견적 신청 처리에 실패했습니다.'
        );
      }

      if (advertisingConsent) {
        trackSuccessfulLead();
      }

      setOk(true);
      setMessage(
        '견적 신청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.'
      );

      formRef.current.reset();
      setPrivacyConsent(false);
      setToken('');

      if (
        window.turnstile &&
        widgetIdRef.current !== null
      ) {
        window.turnstile.reset(widgetIdRef.current);
      }
    } catch (err) {
      setOk(false);

      setMessage(
        err instanceof Error
          ? err.message
          : '잠시 후 다시 시도해 주세요.'
      );

      setToken('');

      if (
        window.turnstile &&
        widgetIdRef.current !== null
      ) {
        window.turnstile.reset(widgetIdRef.current);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="formPanel"
      onSubmit={submit}
    >
      {!canSubmit && (
        <div
          className="notice"
          role="status"
          style={{ marginBottom: 18 }}
        >
          현재 온라인 견적 신청을 준비 중입니다.
          아래 입력 항목은 미리보기용이며
          실제 접수되지 않습니다.
        </div>
      )}

      <fieldset
        disabled={!canSubmit}
        style={{
          border: 0,
          margin: 0,
          padding: 0,
          minWidth: 0,
        }}
      >
        <div className="fields">
          <label>
            모델명 *
            <input
              name="model"
              required
              maxLength={100}
              placeholder="예: PCX125, NMAX, R6"
              autoComplete="off"
            />
          </label>

          <label>
            고객명 *
            <input
              name="customer_name"
              required
              maxLength={60}
              autoComplete="name"
              placeholder="성함을 입력해 주세요"
            />
          </label>

          <label>
            연락처 *
            <input
              name="phone"
              type="tel"
              required
              maxLength={20}
              inputMode="tel"
              autoComplete="tel"
              placeholder="010-0000-0000"
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

          <label>
            제조사
            <input
              name="manufacturer"
              maxLength={80}
              placeholder="예: 혼다, 야마하"
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
            background: '#ffffff',
            color: '#111827',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 800,
              fontSize: 15,
              cursor: canSubmit
                ? 'pointer'
                : 'not-allowed',
            }}
          >
            <input
              type="checkbox"
              checked={
                privacyConsent && advertisingConsent
              }
              onChange={(event) =>
                updateAllConsent(event.target.checked)
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
                  cursor: canSubmit
                    ? 'pointer'
                    : 'not-allowed',
                }}
              >
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(event) =>
                    setPrivacyConsent(
                      event.target.checked
                    )
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
                  marginTop: 6,
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
                  cursor: canSubmit
                    ? 'pointer'
                    : 'not-allowed',
                }}
              >
                <input
                  type="checkbox"
                  checked={advertisingConsent}
                  onChange={(event) =>
                    updateAdvertisingConsent(
                      event.target.checked
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
                완료 이벤트가 Meta와 당근에
                전송될 수 있습니다.
                동의하지 않아도 견적 신청이 가능합니다.
                광고 추적 동의는 홈페이지의
                광고 추적 설정에서 변경할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {canSubmit && (
          <div
            ref={captchaRef}
            className="captcha"
          />
        )}

        <button
          className="btn primary full"
          type="submit"
          disabled={
            !canSubmit ||
            !privacyConsent ||
            !token ||
            busy
          }
        >
          {busy
            ? '접수 중...'
            : canSubmit
              ? '무료 견적 신청하기'
              : '견적 신청 준비 중'}
        </button>
      </fieldset>

      {message && (
        <p
          role="status"
          className={
            ok ? 'formSuccess' : 'formError'
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
