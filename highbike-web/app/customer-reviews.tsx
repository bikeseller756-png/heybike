
'use client';

import { useEffect, useState } from 'react';
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

  // 후기 개수가 적어도 자연스럽게 반복
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

  // 같은 배열을 2번 이어서 무한 흐름 구현
  const rollingReviews = [
    ...baseReviews,
    ...baseReviews,
  ];

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
      </div>

      {loading ? (
        <div className="heyContainer">
          <div className="heyReviewsEmpty">
            고객 후기를 불러오는 중입니다.
          </div>
        </div>
      ) : error ? (
        <div className="heyContainer">
          <div className="heyReviewsEmpty">
            고객 후기를 불러오지 못했습니다.
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="heyContainer">
          <div className="heyReviewsEmpty">
            등록된 고객 후기가 없습니다.
          </div>
        </div>
      ) : (
        <div className="heyReviewsMarquee">
          <div className="heyReviewsTrack">
            {rollingReviews.map((review, index) => (
              <article
                className="heyReviewCard"
                key={`${review.id}-${index}`}
                aria-hidden={index >= baseReviews.length}
              >
                <div className="heyReviewImage">
                  <img
                    src={`/api/admin/image?id=${encodeURIComponent(
                      review.id
                    )}`}
                    alt={`${
                      review.model_name || '오토바이'
                    } 고객 후기 사진`}
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

                  <strong className="heyReviewCustomer">
                    고객 후기
                  </strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
