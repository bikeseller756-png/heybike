
'use client';

import { useEffect, useMemo, useState } from 'react';

type Inquiry = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  manufacturer: string | null;
  model: string;
  model_year: number | null;
  mileage_km: number | null;
  location: string | null;
  condition_notes: string | null;
  status: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

type Source = '메타 광고' | '당근 광고' | '카카오 광고' | '기타 / 미확인';

function sourceName(source: string | null): Source {
  const value = (source || '').toLowerCase();

  if (
    value.includes('meta') ||
    value.includes('facebook') ||
    value.includes('instagram') ||
    value === 'fb' ||
    value === 'ig'
  ) {
    return '메타 광고';
  }

  if (
    value.includes('daangn') ||
    value.includes('karrot') ||
    value.includes('당근')
  ) {
    return '당근 광고';
  }

  if (
    value.includes('kakao') ||
    value.includes('카카오')
  ) {
    return '카카오 광고';
  }

  return '기타 / 미확인';
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
  });
}

export default function AdminDashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');

  async function loadInquiries() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/inquiries', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.replace('/admin');
        return;
      }

      if (!response.ok) {
        throw new Error(
          '고객 신청 내역을 불러오지 못했습니다.'
        );
      }

      const result = await response.json();
      setInquiries(
        Array.isArray(result.inquiries)
          ? result.inquiries
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError('');

    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('로그아웃에 실패했습니다.');
      }

      setInquiries([]);
      window.location.replace('/admin');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '로그아웃 중 오류가 발생했습니다.'
      );
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    void loadInquiries();
  }, []);

  const stats = useMemo(() => {
    const count = (source: Source) =>
      inquiries.filter(
        (item) => sourceName(item.utm_source) === source
      ).length;

    return {
      total: inquiries.length,
      meta: count('메타 광고'),
      daangn: count('당근 광고'),
      kakao: count('카카오 광고'),
      other: count('기타 / 미확인'),
    };
  }, [inquiries]);

  const filtered = useMemo(() => {
    return inquiries.filter((item) => {
      const source = sourceName(item.utm_source);

      if (filter !== '전체' && filter !== source) {
        return false;
      }

      const keyword = search.trim().toLowerCase();

      if (!keyword) return true;

      return [
        item.customer_name,
        item.phone,
        item.manufacturer,
        item.model,
        item.location,
        item.utm_campaign,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(keyword)
        );
    });
  }, [inquiries, filter, search]);

  const cardStyle: React.CSSProperties = {
    background: '#162923',
    border: '1px solid #31594a',
    borderRadius: 14,
    padding: 22,
  };

  const buttonStyle: React.CSSProperties = {
    background: '#21a875',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    padding: '11px 18px',
    cursor: 'pointer',
    fontWeight: 700,
  };

  const inputStyle: React.CSSProperties = {
    padding: 12,
    borderRadius: 8,
    background: '#0d1d18',
    color: '#fff',
    border: '1px solid #426455',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0d1d18',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        padding: '32px 20px',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>
              HEY
              <span style={{ color: '#5de0a5' }}>
                BIKE
              </span>
            </h1>
            <p style={{ color: '#b2c9be' }}>
              관리자 대시보드 · 고객 견적 신청 관리
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => void loadInquiries()}
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
              }}
            >
              새로고침
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              style={{
                ...buttonStyle,
                background: '#355346',
                opacity: loggingOut ? 0.6 : 1,
              }}
            >
              {loggingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            ['전체 신청', stats.total],
            ['메타 광고', stats.meta],
            ['당근 광고', stats.daangn],
            ['카카오 광고', stats.kakao],
            ['기타 / 미확인', stats.other],
          ].map(([label, count]) => (
            <div key={label} style={cardStyle}>
              <div
                style={{
                  color: '#b2c9be',
                  marginBottom: 12,
                }}
              >
                {label}
              </div>
              <strong style={{ fontSize: 32 }}>
                {count}건
              </strong>
            </div>
          ))}
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>
            고객 견적 신청 목록
          </h2>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={inputStyle}
            >
              <option>전체</option>
              <option>메타 광고</option>
              <option>당근 광고</option>
              <option>카카오 광고</option>
              <option>기타 / 미확인</option>
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="고객명, 전화번호, 차종 검색"
              style={{
                ...inputStyle,
                flex: 1,
                minWidth: 200,
              }}
            />
          </div>

          {error && (
            <p role="alert" style={{ color: '#ff9999' }}>
              {error}
            </p>
          )}

          {loading ? (
            <p>신청 내역을 불러오는 중입니다...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#b2c9be' }}>
              표시할 견적 신청 내역이 없습니다.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  minWidth: 900,
                }}
              >
                <thead>
                  <tr style={{ color: '#b2c9be' }}>
                    {[
                      '신청일',
                      '고객명',
                      '연락처',
                      '제조사 / 모델',
                      '지역',
                      '유입 경로',
                      '광고 캠페인',
                      '상태',
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: 12,
                          borderBottom:
                            '1px solid #426455',
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: 12 }}>
                        {formatDate(item.created_at)}
                      </td>
                      <td style={{ padding: 12 }}>
                        {item.customer_name}
                      </td>
                      <td style={{ padding: 12 }}>
                        {item.phone}
                      </td>
                      <td style={{ padding: 12 }}>
                        {[
                          item.manufacturer,
                          item.model,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </td>
                      <td style={{ padding: 12 }}>
                        {item.location || '-'}
                      </td>
                      <td style={{ padding: 12 }}>
                        {sourceName(item.utm_source)}
                      </td>
                      <td style={{ padding: 12 }}>
                        {item.utm_campaign || '-'}
                      </td>
                      <td style={{ padding: 12 }}>
                        {item.status || '접수'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p
            style={{
              color: '#b2c9be',
              fontSize: 12,
              marginTop: 20,
            }}
          >
            최근 신청 100건 기준 · 광고 출처는
            UTM 정보가 전달된 경우에만 구분됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}
