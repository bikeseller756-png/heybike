
'use client';

import { useEffect, useState } from 'react';
import './hero-stats.css';

type Stats = {
  today: number;
  total: number;
  completed: number;
};

function getKoreanDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function seededRandom(seed: string): number {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967296;
}

function generateStats(date: string): Stats {
  // 매일 100~199건 사이의 예시 수치
  const today =
    100 +
    Math.floor(seededRandom(`${date}-today`) * 100);

  // 80,000~99,999건 사이의 예시 수치
  const total =
    80000 +
    Math.floor(seededRandom(`${date}-total`) * 20000);

  // 전체 상담 건수의 80%를 가정한 예상치
  const completed = Math.round(total * 0.8);

  return {
    today,
    total,
    completed,
  };
}

function formatNumber(value: number) {
  return `+${value.toLocaleString('ko-KR')}`;
}

export default function ConsultationStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const update = () => {
      setStats(generateStats(getKoreanDate()));
    };

    update();

    const timer = window.setInterval(update, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  if (!stats) {
    return null;
  }

  return (
    <div className="heyHeroStats">
      <div className="heyHeroStatsGrid">
        <article className="heyHeroStatCard">
          <span className="heyHeroStatLabel">
            오늘의 예상 문의건수
          </span>

          <strong className="heyHeroStatNumber">
            {formatNumber(stats.today)}
          </strong>
        </article>

        <article className="heyHeroStatCard">
          <span className="heyHeroStatLabel">
            전체 상담 문의건수 예시
          </span>

          <strong className="heyHeroStatNumber">
            {formatNumber(stats.total)}
          </strong>
        </article>

        <article className="heyHeroStatCard">
          <span className="heyHeroStatLabel">
            예상 거래 성사 (80% 가정)
          </span>

          <strong className="heyHeroStatNumber">
            {formatNumber(stats.completed)}
          </strong>
        </article>
      </div>

      <p className="heyHeroStatsNote">
        화면 연출용 예시 통계이며 실제 집계와 다를 수 있습니다.
      </p>
    </div>
  );
}
