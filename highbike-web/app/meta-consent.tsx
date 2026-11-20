
'use client';

import { useEffect, useState } from 'react';

const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || '';

const KARROT_PIXEL_ID =
  process.env.NEXT_PUBLIC_KARROT_PIXEL_ID?.trim() || '';

export const CONSENT_KEY = 'heybike_ad_consent';

export const CONSENT_EVENT =
  'heybike-ad-consent-changed';

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

let metaStarted = false;
let karrotStarted = false;

function hasAdvertisingPixels() {
  return Boolean(META_PIXEL_ID || KARROT_PIXEL_ID);
}

export function getAdvertisingConsent(): Consent {
  if (typeof window === 'undefined') return null;

  try {
    const value = localStorage.getItem(CONSENT_KEY);

    if (value === 'accepted' || value === 'rejected') {
      return value;
    }
  } catch {
    return null;
  }

  return null;
}

export function startAdvertisingPixels() {
  if (typeof window === 'undefined') return;

  if (getAdvertisingConsent() !== 'accepted') {
    return;
  }

  if (!hasAdvertisingPixels()) {
    return;
  }

  if (META_PIXEL_ID && !metaStarted) {
    metaStarted = true;

    if (!window.fbq) {
      const fbq: MetaPixelFunction = (
        ...args: unknown[]
      ) => {
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

    window.fbq?.('init', META_PIXEL_ID);
    window.fbq?.('track', 'PageView');

    const script = document.createElement('script');
    script.async = true;
    script.src =
      'https://connect.facebook.net/en_US/fbevents.js';

    document.head.appendChild(script);
  }

  if (KARROT_PIXEL_ID && !karrotStarted) {
    karrotStarted = true;

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

    window.karrotPixel.init(KARROT_PIXEL_ID);
    window.karrotPixel.track('ViewPage');

    const script = document.createElement('script');
    script.async = true;
    script.src =
      'https://karrot-pixel.business.daangn.com/karrot-pixel.js';

    document.head.appendChild(script);
  }
}

export function saveAdvertisingConsent(
  value: 'accepted' | 'rejected'
) {
  if (typeof window === 'undefined') return;

  const previous = getAdvertisingConsent();

  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT, {
      detail: value,
    })
  );

  if (value === 'accepted') {
    startAdvertisingPixels();
  }

  if (
    value === 'rejected' &&
    previous === 'accepted' &&
    (metaStarted || karrotStarted)
  ) {
    window.location.reload();
  }
}

export default function MetaConsent() {
  const [consent, setConsent] =
    useState<Consent>(null);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = getAdvertisingConsent();

    setConsent(saved);
    setReady(true);

    if (saved === 'accepted') {
      startAdvertisingPixels();
    }

    const handleChange = () => {
      setConsent(getAdvertisingConsent());
    };

    window.addEventListener(
      CONSENT_EVENT,
      handleChange
    );

    return () => {
      window.removeEventListener(
        CONSENT_EVENT,
        handleChange
      );
    };
  }, []);

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (consent === 'accepted') {
          const confirmed = window.confirm(
            '광고 추적 동의를 철회하시겠습니까?'
          );

          if (confirmed) {
            saveAdvertisingConsent('rejected');
          }

          return;
        }

        const confirmed = window.confirm(
          'Meta 및 당근 광고 성과 측정을 위한 추적에 동의하시겠습니까?'
        );

        if (confirmed) {
          saveAdvertisingConsent('accepted');
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
        boxShadow: '0 3px 12px rgba(0,0,0,.12)',
      }}
    >
      광고 추적 설정
    </button>
  );
}
