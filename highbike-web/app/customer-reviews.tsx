
'use client';

import { useEffect, useState } from 'react';
import './customer-reviews.css';

type Review = {
  id: string;
  customer_name?: string;
  name?: string;
  motorcycle_model?: string;
  model?: string;
  review_text?: string;
  content?: string;
  rating?: number;
  image_url?: string | null;
  photo_url?: string | null;
};

function getText(review: Review) {
  return review.review_text || review.content || '';
}

function getName(review: Review) {
  return review.customer_name || review.name || '고객 후기';
}

function getModel(review: Review) {
  return review.motorcycle_model || review.model || '오토바이 매입';
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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

        const items: Review[] = Array.isArray(result)
          ? result
          : Array.isArray(result.reviews)
            ? result.reviews
            : Array.isArray(result.data)
              ? result.data
              : [];

        if (active) {
          setReviews(items);
        }
      } catch (error) {
        console.error('고객 후기 조회 오류:', error);
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
    if (reviews.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % reviews.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [reviews.length]);

  const previous = () => {
    setIndex((current) =>
      (current - 1 + reviews.length) % reviews.length
    );
  };

  const next = () => {
    setIndex((current) =>
      (current + 1) % reviews.length
    );
  };

  if (loading) {
    return (
      <section className="heyReviews">
        <div className="heyContainer">
          <p className="heyReviewsStatus">
            고객 후기를 불러오는 중입니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="heyReviews">
      <div className="heyContainer">
        <div className="heyReviewsHeading">
          <span className="heySectionTag">
            CUSTOMER REVIEWS
          </span>

          <h2>
            헤이바이크를 이용한
            <br />
            고객들의 이야기.
          </h2>

          <p>
            실제 등록된 고객 후기를 확인해 보세요.
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="heyReviewsEmpty">
            등록된 고객 후기가 없습니다.
          </div>
        ) : (
          <>
            <div className="heyReviewsViewport">
              <div
                className="heyReviewsTrack"
                style={{
                  transform: `translateX(-${index * 100}%)`,
                }}
              >
                {reviews.map((review) => {
                  const image =
                    review.image_url || review.photo_url;

                  return (
                    <article
                      className="heyReviewSlide"
                      key={review.id}
                    >
                      <div className="heyReviewCard">
                        {image && (
                          <div className="heyReviewImage">
                            <img
                              src={image}
                              alt={`${getModel(review)} 고객 후기`}
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="heyReviewContent">
                          <span className="heyReviewStars">
                            {'★'.repeat(
                              Math.min(
                                5,
                                Math.max(0, review.rating ?? 5)
                              )
                            )}
                          </span>

                          <h3>{getModel(review)}</h3>

                          <p>
                            {getText(review)}
                          </p>

                          <strong>
                            {getName(review)}
                          </strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="heyReviewsControls">
              <button
                type="button"
                onClick={previous}
                aria-label="이전 후기"
              >
                ‹
              </button>

              <span>
                {index + 1} / {reviews.length}
              </span>

              <button
                type="button"
                onClick={next}
                aria-label="다음 후기"
              >
                ›
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
