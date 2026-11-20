
'use client';

import { useEffect, useRef, useState } from 'react';
import './customer-reviews.css';

type Review = {
  id: string;
  model_name: string | null;
  rating: number | null;
  review_text: string | null;
  image_path: string | null;
};

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedReview, setSelectedReview] =
    useState<Review | null>(null);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      try {
        const response = await fetch('/api/reviews', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('후기 조회 실패');
        }

        const result = await response.json();

        const items: Review[] = Array.isArray(result.reviews)
          ? result.reviews
          : [];

        if (active) {
          setReviews(items);
        }
      } catch (err) {
        console.error('고객 후기 조회 오류:', err);

        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedReview) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedReview(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [selectedReview]);

  const baseReviews =
    reviews.length > 0
      ? Array.from(
          {
            length: Math.max(
              6,
              Math.ceil(6 / reviews.length) * reviews.length
            ),
          },
          (_, index) => reviews[index % reviews.length]
        )
      : [];

  const rollingReviews = [...baseReviews, ...baseReviews];

  const imageUrl = (id: string) =>
    `/api/admin/image?id=${encodeURIComponent(id)}`;

  return (
    <section className="heyReviews">
      <div className="heyContainer">
        <div className="heyReviewsHeading">
          <span className="heySectionTag">
            CUSTOMER REVIEWS
          </span>

          <h2>헤이바이크를 이용한 고객들의 이야기.</h2>

          <p>
            실제 등록된 고객 후기를 확인해 보세요.
          </p>
        </div>
      </div>

      {loading || error || reviews.length === 0 ? (
        <div className="heyContainer">
          <div className="heyReviewsEmpty">
            {loading
              ? '고객 후기를 불러오는 중입니다.'
              : error
                ? '고객 후기를 불러오지 못했습니다.'
                : '등록된 고객 후기가 없습니다.'}
          </div>
        </div>
      ) : (
        <div
          className={
            selectedReview
              ? 'heyReviewsMarquee heyReviewsPaused'
              : 'heyReviewsMarquee'
          }
        >
          <div className="heyReviewsTrack">
            {rollingReviews.map((review, index) => (
              <article
                className="heyReviewCard"
                key={`${review.id}-${index}`}
                aria-hidden={index >= baseReviews.length}
              >
                <div className="heyReviewImage">
                  <img
                    src={imageUrl(review.id)}
                    alt={`${review.model_name || '오토바이'} 후기 사진`}
                    loading="lazy"
                  />
                </div>

                <div className="heyReviewContent">
                  <div className="heyReviewStars">
                    {'★'.repeat(
                      Math.min(
                        5,
                        Math.max(0, review.rating ?? 5)
                      )
                    )}
                  </div>

                  <h3>
                    {review.model_name || '오토바이 매입'}
                  </h3>

                  <p className="heyReviewText">
                    {review.review_text || ''}
                  </p>

                  <button
                    className="heyReviewReadMore"
                    type="button"
                    tabIndex={
                      index >= baseReviews.length ? -1 : 0
                    }
                    onClick={() => setSelectedReview(review)}
                  >
                    후기 전체보기 →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {selectedReview && (
        <div
          className="heyReviewModalBackdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedReview(null);
            }
          }}
        >
          <div
            className="heyReviewModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="heyReviewModalTitle"
          >
            <div className="heyReviewModalHeader">
              <h2 id="heyReviewModalTitle">
                고객 후기
              </h2>

              <button
                ref={closeButtonRef}
                type="button"
                aria-label="후기 닫기"
                onClick={() => setSelectedReview(null)}
              >
                ×
              </button>
            </div>

            <div className="heyReviewModalBody">
              <img
                className="heyReviewModalImage"
                src={imageUrl(selectedReview.id)}
                alt={`${selectedReview.model_name || '오토바이'} 후기 사진`}
              />

              <div className="heyReviewStars">
                {'★'.repeat(
                  Math.min(
                    5,
                    Math.max(0, selectedReview.rating ?? 5)
                  )
                )}
              </div>

              <h3>
                {selectedReview.model_name || '오토바이 매입'}
              </h3>

              <p className="heyReviewModalText">
                {selectedReview.review_text || ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
