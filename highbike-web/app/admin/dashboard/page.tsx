
'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from 'react';
import {
  ClipboardList,
  Star,
  ImagePlus,
  Pencil,
  Trash2,
  RefreshCw,
} from 'lucide-react';

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

type Review = {
  id: string;
  model_name: string;
  rating: number;
  review_text: string;
  image_path: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type ReviewForm = {
  model_name: string;
  rating: number;
  review_text: string;
  image_path: string;
  is_published: boolean;
  sort_order: number;
};

type Source =
  | '메타 광고'
  | '당근 광고'
  | '카카오 광고'
  | '기타 / 미확인';

const emptyReview: ReviewForm = {
  model_name: '',
  rating: 5,
  review_text: '',
  image_path: '',
  is_published: false,
  sort_order: 0,
};

const cardStyle: CSSProperties = {
  background: '#162923',
  border: '1px solid #31594a',
  borderRadius: 14,
  padding: 22,
};

const buttonStyle: CSSProperties = {
  background: '#21a875',
  color: '#ffffff',
  border: 0,
  borderRadius: 8,
  padding: '11px 18px',
  cursor: 'pointer',
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  borderRadius: 8,
  background: '#0d1d18',
  color: '#ffffff',
  border: '1px solid #426455',
  fontSize: 14,
};

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

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
  });
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'inquiries' | 'reviews'>(
    'inquiries'
  );

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(
    null
  );
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    ...emptyReview,
  });
  const [selectedFileName, setSelectedFileName] =
    useState('');

  async function loadInquiries() {
    setLoading(true);
    setInquiryError('');

    try {
      const response = await fetch('/api/admin/inquiries', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.replace('/admin');
        return;
      }

      const result = await readJson(response);

      if (!response.ok) {
        throw new Error(
          result.error ||
            '고객 신청 내역을 불러오지 못했습니다.'
        );
      }

      setInquiries(
        Array.isArray(result.inquiries)
          ? result.inquiries
          : []
      );
    } catch (err) {
      setInquiryError(
        err instanceof Error
          ? err.message
          : '오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    setReviewsLoading(true);
    setReviewError('');

    try {
      const response = await fetch('/api/admin/reviews', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.replace('/admin');
        return;
      }

      const result = await readJson(response);

      if (!response.ok) {
        throw new Error(
          result.error || '후기 목록 조회에 실패했습니다.'
        );
      }

      setReviews(
        Array.isArray(result.reviews)
          ? result.reviews
          : []
      );
      setReviewsLoaded(true);
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : '후기 목록 조회 중 오류가 발생했습니다.'
      );
    } finally {
      setReviewsLoading(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setInquiryError('');

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
      setReviews([]);
      window.location.replace('/admin');
    } catch (err) {
      setInquiryError(
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

  useEffect(() => {
    if (tab === 'reviews' && !reviewsLoaded) {
      void loadReviews();
    }
  }, [tab, reviewsLoaded]);

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

  function resetReviewForm() {
    setEditingId(null);
    setReviewForm({ ...emptyReview });
    setSelectedFileName('');
    setReviewError('');
    setReviewSuccess('');
  }

  function editReview(review: Review) {
    setEditingId(review.id);
    setReviewForm({
      model_name: review.model_name,
      rating: review.rating,
      review_text: review.review_text,
      image_path: review.image_path || '',
      is_published: review.is_published,
      sort_order: review.sort_order,
    });
    setSelectedFileName('');
    setReviewError('');
    setReviewSuccess('');

    document
      .getElementById('review-editor')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  }

  async function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || uploading || reviewBusy) return;

    setReviewError('');
    setReviewSuccess('');

    if (file.size > 5 * 1024 * 1024) {
      setReviewError('사진 크기는 5MB 이하여야 합니다.');
      event.target.value = '';
      return;
    }

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type)
    ) {
      setReviewError(
        'JPG, PNG, WEBP 사진만 등록할 수 있습니다.'
      );
      event.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        '/api/admin/reviews/upload',
        {
          method: 'POST',
          credentials: 'same-origin',
          body: formData,
          cache: 'no-store',
        }
      );

      if (response.status === 401) {
        window.location.replace('/admin');
        return;
      }

      const result = await readJson(response);

      if (!response.ok) {
        throw new Error(
          result.error || '사진 업로드에 실패했습니다.'
        );
      }

      if (typeof result.image_path !== 'string') {
        throw new Error(
          '사진 저장 경로를 확인하지 못했습니다.'
        );
      }

      setReviewForm((prev) => ({
        ...prev,
        image_path: result.image_path,
      }));

      setSelectedFileName(file.name);
      setReviewSuccess(
        '사진 업로드가 완료되었습니다. 후기 저장 버튼을 눌러 등록하세요.'
      );
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : '사진 업로드 중 오류가 발생했습니다.'
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (reviewBusy || uploading) return;

    setReviewError('');
    setReviewSuccess('');

    if (!reviewForm.model_name.trim()) {
      setReviewError('차량명을 입력해 주세요.');
      return;
    }

    if (!reviewForm.review_text.trim()) {
      setReviewError('고객 후기 내용을 입력해 주세요.');
      return;
    }

    if (!reviewForm.image_path) {
      setReviewError('후기 사진을 업로드해 주세요.');
      return;
    }

    setReviewBusy(true);

    try {
      const response = await fetch('/api/admin/reviews', {
        method: editingId ? 'PATCH' : 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          ...reviewForm,
          model_name: reviewForm.model_name.trim(),
          review_text: reviewForm.review_text.trim(),
        }),
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.replace('/admin');
        return;
      }

      const result = await readJson(response);

      if (!response.ok) {
        throw new Error(
          result.error || '후기 저장에 실패했습니다.'
        );
      }

      const wasEditing = Boolean(editingId);

      setEditingId(null);
      setReviewForm({ ...emptyReview });
      setSelectedFileName('');
      setReviewSuccess(
        wasEditing
          ? '고객 후기가 수정되었습니다.'
          : '고객 후기가 등록되었습니다.'
      );

      await loadReviews();
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : '후기 저장 중 오류가 발생했습니다.'
      );
    } finally {
      setReviewBusy(false);
    }
  }

  async function deleteReview(review: Review) {
    if (reviewBusy || uploading) return;

    const confirmed = window.confirm(
      `[${review.model_name}] 후기를 삭제하시겠습니까?\n삭제한 후기 데이터는 복구할 수 없습니다.`
    );

    if (!confirmed) return;

    setReviewBusy(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: review.id }),
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.replace('/admin');
        return;
      }

      const result = await readJson(response);

      if (!response.ok) {
        throw new Error(
          result.error || '후기 삭제에 실패했습니다.'
        );
      }

      if (editingId === review.id) {
        setEditingId(null);
        setReviewForm({ ...emptyReview });
        setSelectedFileName('');
      }

      setReviewSuccess('고객 후기가 삭제되었습니다.');
      await loadReviews();
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : '후기 삭제 중 오류가 발생했습니다.'
      );
    } finally {
      setReviewBusy(false);
    }
  }

  async function togglePublished(review: Review) {
    if (reviewBusy || uploading) return;

    setReviewBusy(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: review.id,
          model_name: review.model_name,
          rating: review.rating,
          review_text: review.review_text,
          image_path: review.image_path || '',
          sort_order: review.sort_order,
          is_published: !review.is_published,
        }),
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.replace('/admin');
        return;
      }

      const result = await readJson(response);

      if (!response.ok) {
        throw new Error(
          result.error || '공개 설정 변경에 실패했습니다.'
        );
      }

      setReviewSuccess('후기 공개 설정을 변경했습니다.');
      await loadReviews();
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : '공개 설정 변경 중 오류가 발생했습니다.'
      );
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0d1d18',
        color: '#ffffff',
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
            marginBottom: 26,
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
              관리자 대시보드
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
              onClick={() =>
                void (
                  tab === 'inquiries'
                    ? loadInquiries()
                    : loadReviews()
                )
              }
              disabled={
                tab === 'inquiries'
                  ? loading
                  : reviewsLoading
              }
              style={buttonStyle}
            >
              <RefreshCw
                size={15}
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: 6,
                }}
              />
              새로고침
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              style={{
                ...buttonStyle,
                background: '#355346',
              }}
            >
              {loggingOut
                ? '로그아웃 중...'
                : '로그아웃'}
            </button>
          </div>
        </header>

        <nav
          aria-label="관리자 메뉴"
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('inquiries')}
            style={{
              ...buttonStyle,
              background:
                tab === 'inquiries'
                  ? '#21a875'
                  : '#29463a',
            }}
          >
            <ClipboardList
              size={17}
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: 7,
              }}
            />
            견적 신청 관리
          </button>

          <button
            type="button"
            onClick={() => setTab('reviews')}
            style={{
              ...buttonStyle,
              background:
                tab === 'reviews'
                  ? '#21a875'
                  : '#29463a',
            }}
          >
            <Star
              size={17}
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: 7,
              }}
            />
            고객 후기 관리
          </button>
        </nav>

        {tab === 'inquiries' && (
          <>
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
                  onChange={(e) =>
                    setFilter(e.target.value)
                  }
                  style={{
                    ...inputStyle,
                    width: 'auto',
                  }}
                >
                  <option>전체</option>
                  <option>메타 광고</option>
                  <option>당근 광고</option>
                  <option>카카오 광고</option>
                  <option>기타 / 미확인</option>
                </select>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="고객명, 전화번호, 차종 검색"
                  style={{
                    ...inputStyle,
                    flex: 1,
                    minWidth: 200,
                  }}
                />
              </div>

              {inquiryError && (
                <p
                  role="alert"
                  style={{ color: '#ff9999' }}
                >
                  {inquiryError}
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
                            {formatDate(
                              item.created_at
                            )}
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
                            {sourceName(
                              item.utm_source
                            )}
                          </td>
                          <td style={{ padding: 12 }}>
                            {item.utm_campaign ||
                              '-'}
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
                UTM 정보가 전달된 경우에만
                구분됩니다.
              </p>
            </section>
          </>
        )}

        {tab === 'reviews' && (
          <>
            <section
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}
            >
              {[
                ['전체 후기', reviews.length],
                [
                  '공개 후기',
                  reviews.filter(
                    (item) => item.is_published
                  ).length,
                ],
                [
                  '비공개 후기',
                  reviews.filter(
                    (item) => !item.is_published
                  ).length,
                ],
              ].map(([label, count]) => (
                <div key={label} style={cardStyle}>
                  <p
                    style={{
                      color: '#b2c9be',
                      marginTop: 0,
                    }}
                  >
                    {label}
                  </p>
                  <strong style={{ fontSize: 30 }}>
                    {count}건
                  </strong>
                </div>
              ))}
            </section>

            <section
              id="review-editor"
              style={{
                ...cardStyle,
                marginBottom: 24,
                scrollMarginTop: 24,
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                {editingId
                  ? '고객 후기 수정'
                  : '고객 후기 등록'}
              </h2>

              <p
                style={{
                  color: '#b2c9be',
                  fontSize: 14,
                }}
              >
                실제 고객에게 게시 동의를 받은
                후기와 사진만 등록해 주세요.
              </p>

              {reviewError && (
                <p
                  role="alert"
                  style={{
                    color: '#ff9999',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {reviewError}
                </p>
              )}

              {reviewSuccess && (
                <p
                  role="status"
                  style={{ color: '#5de0a5' }}
                >
                  {reviewSuccess}
                </p>
              )}

              <form onSubmit={saveReview}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 20,
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <label
                      htmlFor="review-image"
                      style={{
                        display: 'block',
                        marginBottom: 9,
                      }}
                    >
                      오토바이 사진
                    </label>

                    <label
                      htmlFor="review-image"
                      style={{
                        minHeight: 170,
                        border:
                          '2px dashed #426455',
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        cursor: uploading
                          ? 'wait'
                          : 'pointer',
                        padding: 15,
                        textAlign: 'center',
                        background: '#10251d',
                      }}
                    >
                      <ImagePlus
                        size={35}
                        color="#5de0a5"
                      />
                      <strong>
                        {uploading
                          ? '사진 업로드 중...'
                          : selectedFileName ||
                            (reviewForm.image_path
                              ? '등록된 사진이 있습니다'
                              : '사진 선택 및 업로드')}
                      </strong>
                      <span
                        style={{
                          color: '#b2c9be',
                          fontSize: 12,
                        }}
                      >
                        JPG, PNG, WEBP / 최대 5MB
                      </span>
                    </label>

                    <input
                      id="review-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={
                        uploading || reviewBusy
                      }
                      style={{ display: 'none' }}
                    />

                    {reviewForm.image_path && (
                      <p
                        style={{
                          color: '#5de0a5',
                          fontSize: 13,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        사진 저장 완료
                        {selectedFileName
                          ? ` · ${selectedFileName}`
                          : ''}
                      </p>
                    )}

                    {editingId &&
                      reviewForm.image_path && (
                        <div
                          style={{
                            marginTop: 12,
                            borderRadius: 10,
                            overflow: 'hidden',
                            background: '#203d32',
                          }}
                        >
                          <img
                            src={`/api/reviews/image?id=${encodeURIComponent(
                              editingId
                            )}`}
                            alt="수정 중인 고객 후기 사진"
                            style={{
                              display: 'block',
                              width: '100%',
                              aspectRatio: '4 / 3',
                              objectFit: 'cover',
                            }}
                          />
                        </div>
                      )}
                  </div>

                  <div>
                    <label
                      htmlFor="review-model"
                      style={{
                        display: 'block',
                        marginBottom: 9,
                      }}
                    >
                      차량명
                    </label>

                    <input
                      id="review-model"
                      required
                      maxLength={100}
                      placeholder="예: 혼다 PCX125"
                      value={reviewForm.model_name}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          model_name: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />

                    <p
                      style={{
                        marginBottom: 8,
                        marginTop: 20,
                      }}
                    >
                      고객 별점
                    </p>

                    <div
                      role="group"
                      aria-label="고객 별점"
                      style={{
                        display: 'flex',
                        gap: 8,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map(
                        (rating) => (
                          <button
                            key={rating}
                            type="button"
                            aria-label={`${rating}점`}
                            aria-pressed={
                              reviewForm.rating ===
                              rating
                            }
                            onClick={() =>
                              setReviewForm(
                                (prev) => ({
                                  ...prev,
                                  rating,
                                })
                              )
                            }
                            style={{
                              border: 0,
                              background:
                                'transparent',
                              padding: 3,
                              cursor: 'pointer',
                            }}
                          >
                            <Star
                              size={29}
                              color={
                                rating <=
                                reviewForm.rating
                                  ? '#ffc247'
                                  : '#71857b'
                              }
                              fill={
                                rating <=
                                reviewForm.rating
                                  ? '#ffc247'
                                  : 'none'
                              }
                            />
                          </button>
                        )
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: 13,
                        color: '#b2c9be',
                      }}
                    >
                      선택한 별점: {reviewForm.rating}점
                    </p>
                  </div>
                </div>

                <label
                  htmlFor="review-text"
                  style={{
                    display: 'block',
                    marginBottom: 9,
                  }}
                >
                  고객 후기 내용
                </label>

                <textarea
                  id="review-text"
                  required
                  maxLength={2000}
                  rows={5}
                  value={reviewForm.review_text}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      review_text: e.target.value,
                    }))
                  }
                  placeholder="고객이 실제 작성한 후기 내용을 입력하세요."
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 20,
                    alignItems: 'center',
                    marginTop: 20,
                  }}
                >
                  <div>
                    <label
                      htmlFor="review-order"
                      style={{
                        display: 'block',
                        marginBottom: 8,
                      }}
                    >
                      노출 순서
                    </label>

                    <input
                      id="review-order"
                      type="number"
                      min={0}
                      max={100000}
                      step={1}
                      value={reviewForm.sort_order}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          sort_order: Number(
                            e.target.value
                          ),
                        }))
                      }
                      style={{
                        ...inputStyle,
                        width: 130,
                      }}
                    />
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      cursor: 'pointer',
                      marginTop: 18,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        reviewForm.is_published
                      }
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          is_published:
                            e.target.checked,
                        }))
                      }
                      style={{
                        width: 19,
                        height: 19,
                      }}
                    />
                    홈페이지 공개
                  </label>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginTop: 24,
                  }}
                >
                  <button
                    type="submit"
                    disabled={
                      reviewBusy || uploading
                    }
                    style={{
                      ...buttonStyle,
                      opacity:
                        reviewBusy || uploading
                          ? 0.6
                          : 1,
                    }}
                  >
                    {reviewBusy
                      ? '저장 중...'
                      : editingId
                        ? '후기 수정 저장'
                        : '고객 후기 등록'}
                  </button>

                  <button
                    type="button"
                    onClick={resetReviewForm}
                    disabled={
                      reviewBusy || uploading
                    }
                    style={{
                      ...buttonStyle,
                      background: '#355346',
                    }}
                  >
                    입력 초기화
                  </button>
                </div>
              </form>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>
                등록된 고객 후기
              </h2>

              <p
                style={{
                  color: '#b2c9be',
                  fontSize: 14,
                }}
              >
                노출 순서가 낮은 후기부터
                표시됩니다. 동일한 순서는
                최신 등록순으로 정렬됩니다.
              </p>

              {reviewsLoading ? (
                <p>후기 목록을 불러오는 중입니다...</p>
              ) : reviews.length === 0 ? (
                <p style={{ color: '#b2c9be' }}>
                  등록된 고객 후기가 없습니다.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 16,
                  }}
                >
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      style={{
                        background: '#10251d',
                        border:
                          '1px solid #31594a',
                        borderRadius: 12,
                        padding: 18,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          background: '#203d32',
                          borderRadius: 9,
                          overflow: 'hidden',
                          marginBottom: 14,
                          aspectRatio: '4 / 3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {review.image_path ? (
                          <img
                            src={`/api/reviews/image?id=${encodeURIComponent(
                              review.id
                            )}`}
                            alt={`${review.model_name} 고객 후기 사진`}
                            loading="lazy"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              textAlign: 'center',
                              color: '#b2c9be',
                            }}
                          >
                            <ImagePlus size={30} />
                            <p style={{ fontSize: 12 }}>
                              등록된 사진이 없습니다.
                            </p>
                          </div>
                        )}
                      </div>

                      <strong
                        style={{
                          fontSize: 17,
                        }}
                      >
                        {review.model_name}
                      </strong>

                      <div
                        style={{
                          color: '#ffc247',
                          marginTop: 10,
                          marginBottom: 10,
                          letterSpacing: 3,
                        }}
                        aria-label={`별점 ${review.rating}점`}
                      >
                        {'★'.repeat(
                          review.rating
                        )}
                        {'☆'.repeat(
                          5 - review.rating
                        )}
                      </div>

                      <p
                        style={{
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'anywhere',
                          color: '#d8e5dd',
                          lineHeight: 1.6,
                          minHeight: 55,
                        }}
                      >
                        {review.review_text}
                      </p>

                      <p
                        style={{
                          fontSize: 12,
                          color: '#b2c9be',
                        }}
                      >
                        노출 순서: {review.sort_order}
                      </p>

                      <p
                        style={{
                          fontSize: 12,
                          color: '#b2c9be',
                        }}
                      >
                        등록일:{' '}
                        {formatDate(
                          review.created_at
                        )}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginTop: 15,
                        }}
                      >
                        <button
                          type="button"
                          disabled={reviewBusy}
                          onClick={() =>
                            void togglePublished(
                              review
                            )
                          }
                          style={{
                            ...buttonStyle,
                            padding: '9px 12px',
                            background:
                              review.is_published
                                ? '#176e52'
                                : '#53665b',
                          }}
                        >
                          {review.is_published
                            ? '공개 중'
                            : '비공개'}
                        </button>

                        <button
                          type="button"
                          disabled={reviewBusy}
                          onClick={() =>
                            editReview(review)
                          }
                          style={{
                            ...buttonStyle,
                            padding: '9px 12px',
                            background: '#355346',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Pencil size={14} />
                          수정
                        </button>

                        <button
                          type="button"
                          disabled={reviewBusy}
                          onClick={() =>
                            void deleteReview(
                              review
                            )
                          }
                          style={{
                            ...buttonStyle,
                            padding: '9px 12px',
                            background: '#853d3d',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Trash2 size={14} />
                          삭제
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <p
                style={{
                  fontSize: 12,
                  color: '#b2c9be',
                  marginTop: 20,
                }}
              >
                공개된 후기는 홈페이지 슬라이더
                연결 후 표시됩니다. 후기 삭제 시
                데이터베이스 기록만 삭제되며
                사진 파일 정리는 별도 작업입니다.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
