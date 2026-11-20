
'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import './customer-reviews.css';

type Review = {
  id: string;
  model_name: string;
  rating: number;
  review_text: string;
  sort_order: number;
  created_at: string;
};

const AUTO_PLAY_MS = 4000;
const TRANSITION_MS = 500;

function getVisibleCount() {
  if (typeof window === 'undefined') return 3;

  if (window.innerWidth <= 640) return 1;
  if (window.innerWidth <= 1024) return 2;

  return 3;
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const [index, setIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] =
    useState(true);
  const [paused, setPaused] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const indexRef = useRef(0);
  const movingRef = useRef(false);
  const resetTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

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

        if (active) {
          setReviews(
            Array.isArray(result.reviews)
              ? result.reviews
              : []
          );
        }
      } catch {
        if (active) setReviews([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReviews();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const update = () => {
      setVisibleCount(getVisibleCount());
    };

    update();
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
    };
  }, []);

  const count = reviews.length;
  const cloneCount = Math.min(visibleCount, count);
  const hasCarousel = count > 1;

  const displayedReviews = hasCarousel
    ? [
        ...reviews.slice(-cloneCount),
        ...reviews,
        ...reviews.slice(0, cloneCount),
      ]
    : reviews;

  useEffect(() => {
    indexRef.current = cloneCount;
    setIndex(cloneCount);
    setTransitionEnabled(false);
    movingRef.current = false;

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [cloneCount, count]);

  const move = useCallback(
    (direction: number) => {
      if (!hasCarousel || movingRef.current) return;

      movingRef.current = true;
      setTransitionEnabled(true);

      indexRef.current += direction;
      setIndex(indexRef.current);
    },
    [hasCarousel]
  );

  function handleTransitionEnd() {
    if (!hasCarousel) return;

    const current = indexRef.current;

    if (current >= count + cloneCount) {
      const next = cloneCount;

      setTransitionEnabled(false);
      indexRef.current = next;
      setIndex(next);
    } else if (current < cloneCount) {
      const next = count + cloneCount - 1;

      setTransitionEnabled(false);
      indexRef.current = next;
      setIndex(next);
    }

    movingRef.current = false;
  }

  useEffect(() => {
    if (!hasCarousel || paused) return;

    const timer = window.setInterval(() => {
      move(1);
    }, AUTO_PLAY_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasCarousel, paused, move]);

  useEffect(() => {
    if (!hasCarousel || !transitionEnabled) return;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      movingRef.current = false;
    }, TRANSITION_MS + 150);

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [index, transitionEnabled, hasCarousel]);

  function handleTouchStart(
    event: React.TouchEvent<HTMLDivElement>
  ) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setPaused(true);
  }

  function handleTouchEnd(
    event: React.TouchEvent<HTMLDivElement>
  ) {
    if (touchStartX.current === null) {
      setPaused(false);
      return;
    }

    const endX =
      event.changedTouches[0]?.clientX ??
      touchStartX.current;

    const difference = touchStartX.current - endX;

    if (Math.abs(difference) > 45) {
      move(difference > 0 ? 1 : -1);
    }

    touchStartX.current = null;
    setPaused(false);
  }

  if (loading || count === 0) {
    return null;
  }

  return (
    <section
      className="heyReviews"
      aria-label="HEYBIKE 고객 후기"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="heyReviewsContainer">
        <div className="heyReviewsHeading">
          <div>
            <span className="heyReviewsEyebrow">
              REAL CUSTOMER REVIEWS
            </span>

            <h2>
              고객이 직접 전하는
              <br />
              <strong>HEYBIKE 매입 후기</strong>
            </h2>

            <p>
              실제 고객의 경험을 통해
              HEYBIKE의 서비스를 확인하세요.
            </p>
          </div>

          {hasCarousel && (
            <div className="heyReviewsControls">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="이전 후기"
              >
                <ChevronLeft size={23} />
              </button>

              <button
                type="button"
                onClick={() => move(1)}
                aria-label="다음 후기"
              >
                <ChevronRight size={23} />
              </button>
            </div>
          )}
        </div>

        <div
          className="heyReviewsViewport"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            touchStartX.current = null;
            setPaused(false);
          }}
        >
          <div
            ref={trackRef}
            className="heyReviewsTrack"
            style={{
              transform: `translateX(calc(-${index} * (var(--review-card-width) + var(--review-gap))))`,
              transition: transitionEnabled
                ? `transform ${TRANSITION_MS}ms ease`
                : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {displayedReviews.map((review, position) => (
              <article
                className="heyReviewCard"
                key={`${review.id}-${position}`}
              >
                <div className="heyReviewImage">
                  <img
                    src={`/api/reviews/image?id=${encodeURIComponent(
                      review.id
                    )}`}
                    alt={`${review.model_name} 매입 후기 사진`}
                    loading="lazy"
                  />
                </div>

                <div className="heyReviewContent">
                  <span className="heyReviewModel">
                    {review.model_name}
                  </span>

                  <div
                    className="heyReviewStars"
                    aria-label={`별점 ${review.rating}점`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={17}
                        fill={
                          i < review.rating
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                    ))}
                  </div>

                  <p>{review.review_text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="heyReviewsFooter">
          <span>
            HEYBIKE CUSTOMER EXPERIENCE
          </span>

          <span>
            실제 고객 후기 · {count}건
          </span>
        </div>
      </div>
    </section>
  );
}
