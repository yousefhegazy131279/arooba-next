"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useEffect, ReactNode } from "react";
import styles from "./flipbook.module.css";

export interface FlipBookSheet {
  front: ReactNode;
  back: ReactNode;
}

export interface FlipBookHandle {
  flipNext: () => void;
  flipPrev: () => void;
  turnToSheet: (index: number) => void;
  getCurrentSheet: () => number;
}

interface Props {
  sheets: FlipBookSheet[];
  initialSheet?: number;
  onFlip?: (sheetIndex: number) => void;
  width: number;
  height: number;
}

const FlipBook = forwardRef<FlipBookHandle, Props>(function FlipBook(
  { sheets, initialSheet = 0, onFlip, width, height },
  ref
) {
  const [current, setCurrent] = useState(initialSheet);
  const [animating, setAnimating] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrent(initialSheet);
  }, [initialSheet]);

  useImperativeHandle(ref, () => ({
    flipNext: () => goNext(),
    flipPrev: () => goPrev(),
    turnToSheet: (index: number) => {
      if (index >= 0 && index <= sheets.length && index !== current) {
        setAnimating(index);
        setCurrent(index);
        onFlip?.(index);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setAnimating(null), 800);
      }
    },
    getCurrentSheet: () => current,
  }));

  const goNext = () => {
    if (current < sheets.length) {
      const nextIndex = current + 1;
      setAnimating(current);
      setCurrent(nextIndex);
      onFlip?.(nextIndex);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setAnimating(null), 800);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      const prevIndex = current - 1;
      setAnimating(prevIndex);
      setCurrent(prevIndex);
      onFlip?.(prevIndex);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setAnimating(null), 800);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // تجاهل النقر على الأزرار والروابط
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, [contenteditable='true']")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const mid = rect.width / 2;

    // RTL: النصف الأيسر = السابق، النصف الأيمن = التالي
    if (x > mid) {
      goNext();
    } else {
      goPrev();
    }
  };

  return (
    <div
      className={styles.bookWrapper}
      style={{ width: width * 2, height }}
    >
      <div
        className={styles.book}
        onClick={handleClick}
        style={{ width: width * 2, height, perspective: "2400px" }}
      >
        {/* الصفحة الساكنة على اليسار (ظهر آخر ورقة مقلوبة) */}
        <div
          className={styles.staticPage + " " + styles.staticLeft}
          style={{ width, height, left: 0 }}
        >
          {current > 0 ? sheets[current - 1].back : null}
        </div>

        {/* الصفحة الساكنة على اليمين (وجه الورقة الحالية) */}
        <div
          className={styles.staticPage + " " + styles.staticRight}
          style={{ width, height, left: width }}
        >
          {current < sheets.length ? sheets[current].front : null}
        </div>

        {/* الأوراق القابلة للتقليب */}
        {sheets.map((sheet, i) => {
          const isFlipped = i < current;
          const isAnimating = animating === i;
          const zIndex = isFlipped
            ? i + 1
            : sheets.length - i + 100;

          return (
            <div
              key={i}
              className={`${styles.sheet} ${isFlipped ? styles.flipped : ""} ${isAnimating ? styles.animating : ""}`}
              style={{
                width,
                height,
                left: width, // الورقة تبدأ من منتصف الكتاب
                zIndex,
                transformOrigin: "left center",
              }}
              aria-hidden={!isFlipped && i !== current}
            >
              <div className={styles.face + " " + styles.frontFace}>
                {sheet.front}
              </div>
              <div className={styles.face + " " + styles.backFace}>
                {sheet.back}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default FlipBook;