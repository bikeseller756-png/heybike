
'use client';

import { useEffect, useState } from 'react';

const META_PIXEL_ID = '998081065899659';
const KARROT_PIXEL_ID = '1793170943337621001';

export const CONSENT_KEY = 'highbike_meta_consent';
export const CONSENT_EVENT = 'highbike-ad-consent-changed';

type Consent = 'accepted' | 'rejected' | null;

type MetaPixelFunction = {
  (...args: unknown[]): void;
  queue?: unknown[][];
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
  push?: typeof Array.prototype.push;
};

type KarrotPixelFunction = {
  init: (id: string) => void;
  track: (event: string) => void;
  stub?: boolean;
  queue?: unknown[][];
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
    karrotPixel?: KarrotPixelFunction;
  }
}

let pixelsStarted = false;

export function startAdvertisingPixels() {
  if (typeof window === 'undefined') return;
  if (pixelsStarted) return;

  // 광고 추적 동의가 없는 경우 실행하지 않음
  try {
    if (localStorage.getItem(CONSENT_KEY) !== 'accepted') {
      return;
    }
  } catch {
    return;
  }

  pixelsStarted = true;

  // Meta 픽셀
  if (!window.fbq) {
    const fbq: MetaPixelFunction = (...args: unknown[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue?.push(args);
      }
    };

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.push = Array.prototype.push;

    window.fbq = fbq;
    window._fbq = fbq;
  }

  const metaScript = document.createElement('script');
  metaScript.async = true;
  metaScript.src =
    'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(metaScript);

  window.fbq?.('init', META_PIXEL_ID);
  window.fbq?.('track', 'PageView');

  // 당근 픽셀
  if (!window.karrotPixel) {
    const karrot: KarrotPixelFunction = {
      stub: true,
      queue: [],
      init: (id: string) => {
        karrot.queue?.push([
          'init',
          [id],
          Date.now(),
        ]);
      },
      track: (event: string) => {
        karrot.queue?.push([
          'track',
          [event],
          Date.now(),
        ]);
      },
    };

    window.karrotPixel = karrot;
  }

  const karrotScript = document.createElement('script');
  karrotScript.async = true;
  karrotScript.src =
    'https://karrot-pixel.business.daangn.com/karrot-pixel.js';
  document.head.appendChild(karrotScript);

  window.karrotPixel.init(KARROT_PIXEL_ID);
  window.karrotPixel.track('ViewPage');
}

export function getAdvertisingConsent(): Consent {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(CONSENT_KEY);

    if (saved === 'accepted' || saved === 'rejected') {
      return saved;
    }
  } catch {
    return null;
  }

  return null;
}

export function saveAdvertisingConsent(
  value: 'accepted' | 'rejected'
) {
  if (typeof window === 'undefined') return;

  const previous = getAdvertisingConsent();

  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // 저장소 접근이 불가능하면 광고 추적을 시작하지 않음
    return;
  }

  if (value === 'accepted') {
    startAdvertisingPixels();
  }

  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT, {
      detail: value,
    })
  );

  // 이미 실행된 픽셀은 단순히 스크립트를 삭제해도
  // 중단되지 않으므로 거부로 변경하면 새로고침
  if (
    value === 'rejected' &&
    previous === 'accepted' &&
    pixelsStarted
  ) {
    window.location.reload();
  }
}

export default function MetaConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = getAdvertisingConsent();
    setConsent(saved);

    if (saved === 'accepted') {
      startAdvertisingPixels();
    }

    const handleChange = () => {
      setConsent(getAdvertisingConsent());
    };

    window.addEventListener(CONSENT_EVENT, handleChange);
    setReady(true);

    return () => {
      window.removeEventListener(
        CONSENT_EVENT,
        handleChange
      );
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      {consent !== null && (
        <button
          type="button"
          onClick={() => {
            const next = window.confirm(
              consent === 'accepted'
                ? '광고 추적 동의를 철회하시겠습니까?'
                : 'Meta 및 당근 광고 성과 측정을 위한 추적에 동의하시겠습니까?'
            );

            if (next) {
              saveAdvertisingConsent(
                consent === 'accepted'
                  ? 'rejected'
                  : 'accepted'
              );
            }
          }}
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 9998,
            padding: '9px 13px',
            borderRadius: 9,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#1f2937',
            fontSize: 12,
            cursor: 'pointer',
            boxShadow:
              '0 3px 12px rgba(0,0,0,.12)',
          }}
        >
          광고 추적 설정
        </button>
      )}
    </>
  );
}
