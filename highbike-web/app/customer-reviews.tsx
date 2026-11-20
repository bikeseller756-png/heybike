
'use client';

import { useEffect, useState } from 'react';
import './customer-reviews.css';

type Review = {
  id: string | number;
  customer_name?: string;
  name?: string;
  motorcycle_model?: string;
  model?: string;
  review_text?: string;
  content?: string;
  rating?: number;
  image_url?: string | null;
  photo_url?: string | null;
  image_urls?: string[];
};

function getName(review: Review) {
  return review.customer_name || review.name || '고객 후기';
}

function getModel(review: Review) {
  return review.motorcycle_model || review.model || '오토바이 매입';
}

function getContent(review: Review) {
  return review.review_text || review.content || '';
}

function getImage(review: Review) {
  return (
    review.image_url ||
    review.photo_url ||
    review.image_urls?.[0] ||
    null
  );
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
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

  // 카드가 2개여도 자연스럽게 반복되도록 확장
  const baseReviews =
    reviews.length > 0
      ? Array.from(
          { length: Math.max(1, Math.ceil(6 / reviews.length)) },
          (_, index) => reviews[index % reviews.length]
        )
      : [];

  // 동일한 카드 배열을 두 번 연결해 무한 반복
  const rollingReviews = [...baseReviews, ...baseReviews];

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
      ) : reviews.length === 0 ? (
        <div className="heyContainer">
          <div className="heyReviewsEmpty">
            등록된 고객 후기가 없습니다.
          </div>
        </div>
      ) : (
        <div className="heyReviewsMarquee">
          <div className="heyReviewsTrack">
            {rollingReviews.map((review, index) => {
              const image = getImage(review);

              return (
                <article
                  className="heyReviewCard"
                  key={`${review.id}-${index}`}
                  aria-hidden={index >= baseReviews.length}
                >
                  {image && (
                    <div className="heyReviewImage">
                      <img
                        src={image}
                        alt={getModel(review)}
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="heyReviewContent">
                    <div className="heyReviewStars">
                      {'★'.repeat(
                        Math.min(
                          5,
                          Math.max(0, review.rating ?? 5)
                        )
                      )}
                    </div>

                    <h3>{getModel(review)}</h3>

                    <p className="heyReviewText">
                      {getContent(review)}
                    </p>

                    <strong className="heyReviewCustomer">
                      {getName(review)}
                    </strong>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
