
'use client';

import { useEffect, useState } from 'react';

type Stats = {
  today: number;
  total: number;
  completed: number;
};

function koreaDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function seededNumber(seed: string) {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967296;
}

function generateStats(dateKey: string): Stats {
  // 매일 100~199건
  const today =
    100 + Math.floor(seededNumber(dateKey + '-today') * 100);

  // 80,000~99,999건
  const total =
    80000 + Math.floor(seededNumber(dateKey + '-total') * 20000);

  // 전체 상담 문의건수의 80%
  const completed = Math.round(total * 0.8);

  return { today, total, completed };
}

function formatCount(value: number) {
  return `+${value.toLocaleString('ko-KR')}`;
}

export default function ConsultationStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const updateStats = () => {
      setStats(generateStats(koreaDateKey()));
    };

    updateStats();

    // 날짜가 바뀌면 새로운 수치 반영
    const interval = window.setInterval(updateStats, 60000);

    return () => window.clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <section
      aria-label="상담 통계 예시"
      style={{
        background: '#1769c9',
        padding: '64px 20px',
        color: '#fff',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            opacity: 0.85,
            marginBottom: 12,
          }}
        >
          HEYBIKE / SAMPLE STATISTICS
        </p>

        <h2
          style={{
            textAlign: 'center',
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          오토바이 상담 현황
        </h2>

        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            opacity: 0.85,
            marginBottom: 36,
          }}
        >
          화면 연출용 예시 수치입니다.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { label: '오늘의 예상 문의건수', value: stats.today },
            { label: '전체 상담 문의건수 예시', value: stats.total },
            { label: '예상 거래 성사 (80% 가정)', value: stats.completed },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 18,
                padding: '30px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(30px, 4vw, 44px)',
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCount(item.value)}
              </div>

              <div
                style={{
                  marginTop: 12,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
