
'use client';

import { useState, type FormEvent } from 'react';
import {
  LockKeyhole,
  ShieldCheck,
  LoaderCircle,
} from 'lucide-react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !password) return;

    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(
          result.error || '로그인에 실패했습니다.'
        );
      }

      setPassword('');
      window.location.replace('/admin/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '다시 시도해 주세요.'
      );
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background:
          'linear-gradient(145deg, #101a19, #183a32)',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 36,
          borderRadius: 20,
          background: '#162923',
          border: '1px solid #31594a',
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: 30,
          }}
        >
          <ShieldCheck size={42} color="#5de0a5" />

          <h1
            style={{
              fontSize: 30,
              margin: '16px 0 8px',
              fontWeight: 800,
            }}
          >
            HEY
            <span style={{ color: '#5de0a5' }}>
              BIKE
            </span>
          </h1>

          <p
            style={{
              color: '#b2c9be',
              fontSize: 14,
            }}
          >
            헤이바이크 관리자 전용 로그인
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label
            htmlFor="admin-password"
            style={{
              display: 'block',
              marginBottom: 10,
              fontSize: 14,
            }}
          >
            관리자 비밀번호
          </label>

          <div style={{ position: 'relative' }}>
            <LockKeyhole
              size={19}
              color="#9dbbad"
              style={{
                position: 'absolute',
                left: 15,
                top: 16,
              }}
            />

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="current-password"
              required
              maxLength={256}
              placeholder="관리자 비밀번호 입력"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '15px 15px 15px 46px',
                borderRadius: 10,
                border: '1px solid #426455',
                background: '#0d1d18',
                color: '#ffffff',
                fontSize: 15,
              }}
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: '#ff9999',
                fontSize: 13,
                marginTop: 12,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !password}
            style={{
              width: '100%',
              marginTop: 22,
              padding: 15,
              border: 0,
              borderRadius: 10,
              background: '#21a875',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <>
                <LoaderCircle
                  size={16}
                  style={{
                    display: 'inline-block',
                    marginRight: 8,
                  }}
                />
                로그인 확인 중...
              </>
            ) : (
              '관리자 로그인'
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            color: '#91aa9d',
            fontSize: 12,
            marginTop: 26,
          }}
        >
          승인된 관리자만 이용할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
