import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { formatCurrency } from "@hotelos/utils";
import type { Order } from "../types";

function getStageLabel(status: string) {
  switch (status) {
    case "NEW":
      return "Order Placed";
    case "CONFIRMED":
      return "Confirmed";
    case "PREPARING":
      return "Preparing";
    case "READY":
      return "Ready to Serve";
    case "OUT_FOR_DELIVERY":
      return "Serving";
    case "DELIVERED":
      return "Served";
    default:
      return status;
  }
}

function getStagePercent(status: string) {
  switch (status) {
    case "NEW":
      return 25;
    case "CONFIRMED":
      return 50;
    case "PREPARING":
      return 75;
    case "READY":
    case "OUT_FOR_DELIVERY":
    case "DELIVERED":
      return 100;
    default:
      return 20;
  }
}

interface OrderProgressCarouselProps {
  activeOrders: Order[];
  base: string;
  onClose?: () => void;
}

export function OrderProgressCarousel({
  activeOrders,
  base,
  onClose,
}: OrderProgressCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  // Keep index clamped if orders count changes
  useEffect(() => {
    if (currentIndex >= activeOrders.length && activeOrders.length > 0) {
      setCurrentIndex(activeOrders.length - 1);
    }
  }, [activeOrders.length, currentIndex]);

  // Auto-slide every 4.5 seconds when multiple orders exist and not paused
  useEffect(() => {
    if (activeOrders.length <= 1 || isPaused) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeOrders.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [activeOrders.length, isPaused]);

  if (activeOrders.length === 0) return null;

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex(
      (prev) => (prev - 1 + activeOrders.length) % activeOrders.length,
    );
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeOrders.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null) {
      const threshold = 40;
      if (touchDeltaXRef.current < -threshold) {
        handleNext();
      } else if (touchDeltaXRef.current > threshold) {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setIsPaused(false);
  };

  const hasMultiple = activeOrders.length > 1;

  return (
    <div
      className="soh-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding Track */}
      <div
        className="soh-carousel-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {activeOrders.map((order, idx) => {
          const itemCount = Array.isArray(order.items)
            ? order.items.reduce((s, it) => s + (it.quantity || 1), 0)
            : 0;

          return (
            <div key={order.id} className="soh-carousel-slide">
              <div className="soh-header">
                <span className="soh-badge">
                  <span className="soh-pulse" />
                  ORDER IN PROGRESS
                </span>
                <span className="soh-id">
                  #{order.id.slice(-6).toUpperCase()}
                </span>
              </div>

              <Link
                to={`${base}/order/${order.id}`}
                onClick={onClose}
                className="soh-body"
              >
                <div className="soh-status-row">
                  <span className="soh-status">
                    <Flame size={13} className="soh-flame" />
                    {getStageLabel(order.status)}
                  </span>
                  <span className="soh-count">
                    {hasMultiple
                      ? `Card ${idx + 1} of ${activeOrders.length}`
                      : `${itemCount} items · ${formatCurrency(order.totalAmount)}`}
                  </span>
                </div>

                <div className="soh-progress-bar">
                  <div
                    className="soh-progress-fill"
                    style={{ width: `${getStagePercent(order.status)}%` }}
                  />
                </div>

                <div className="soh-tap-cta">
                  <span>View Full Progress</span>
                  <ChevronRight size={13} />
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Manual Slide Arrows (Visible on hover if multiple cards) */}
      {hasMultiple && (
        <>
          <button
            type="button"
            className="soh-nav-btn prev"
            onClick={handlePrev}
            aria-label="Previous order card"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            className="soh-nav-btn next"
            onClick={handleNext}
            aria-label="Next order card"
          >
            <ChevronRight size={13} />
          </button>
        </>
      )}

      {/* Circle Indicators Bar */}
      {hasMultiple && (
        <div className="soh-dots-bar">
          {activeOrders.map((order, i) => (
            <button
              type="button"
              key={order.id}
              className={`soh-dot ${i === currentIndex ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              aria-label={`Go to active order ${i + 1} of ${activeOrders.length}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
