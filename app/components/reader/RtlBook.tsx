'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { adjacentSpread, bookSpread } from '@/lib/book-layout';
import styles from './rtl-book.module.css';

export type RtlBookHandle = { goTo: (page: number, animate?: boolean) => void };
type Props = {
  page: number; total: number; width: number; height: number; single: boolean;
  renderPage: (index: number, active: boolean) => ReactNode;
  onChange: (index: number) => void;
};
type Turn = { from: number; to: number; forward: boolean };

const RtlBook = forwardRef<RtlBookHandle, Props>(function RtlBook({ page, total, width, height, single, renderPage, onChange }, ref) {
  const [turn, setTurn] = useState<Turn | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  const pointer = useRef<{ x: number; y: number; edge: boolean } | null>(null);
  const spread = bookSpread(page, total, single);
  const next = adjacentSpread(page, total, single, 1);
  const previous = adjacentSpread(page, total, single, -1);

  function goTo(target: number, animate = true) {
    if (target < 0 || target >= total) return;
    if (locked.current) {
      if (animate) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      locked.current = false;
      setTurn(null);
      onChange(target);
      return;
    }
    const destination = bookSpread(target, total, single).right;
    if (!animate || destination === spread.right || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onChange(target); return; }
    locked.current = true;
    setTurn({ from: spread.right, to: destination, forward: destination > spread.right });
    timer.current = setTimeout(() => {
      onChange(target);
      setTurn(null);
      locked.current = false;
      timer.current = null;
    }, 620);
  }
  useImperativeHandle(ref, () => ({ goTo }));
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const source = turn ? bookSpread(turn.from, total, single) : spread;
  const target = turn ? bookSpread(turn.to, total, single) : spread;
  const staticRight = turn && (single || !turn.forward) ? target.right : source.right;
  const staticLeft = turn?.forward ? target.left : source.left;
  const front = turn ? (single ? turn.from : turn.forward ? source.left : source.right) : null;
  const back = turn ? (single ? turn.to : turn.forward ? target.right : target.left) : null;
  const leaf = (index: number | null, active: boolean) => index === null
    ? <div className={styles.endPaper}><span>عُروبة</span><span>نهاية الفصل</span></div>
    : renderPage(index, active);

  return <div className={styles.stage} data-single={single}>
    <div className={styles.book} style={{ width: width * (single ? 1 : 2), height }} data-single={single} data-turning={Boolean(turn)} dir="ltr"
      onPointerDown={event => {
        if ((event.target as HTMLElement).closest('button,a,input,textarea,select')) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        pointer.current = { x: event.clientX, y: event.clientY, edge: x < 46 || x > bounds.width - 46 };
      }}
      onPointerCancel={() => { pointer.current = null; }}
      onPointerUp={event => {
        const start = pointer.current; pointer.current = null;
        if (!start || locked.current || window.getSelection()?.toString()) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          const destination = dx > 0 ? next : previous;
          if (destination !== null) goTo(destination);
        } else if (start.edge && Math.abs(dx) < 8 && Math.abs(dy) < 8) {
          const bounds = event.currentTarget.getBoundingClientRect();
          const destination = event.clientX - bounds.left < bounds.width / 2 ? next : previous;
          if (destination !== null) goTo(destination);
        }
      }}>
      <div className={`${styles.staticPage} ${styles.right}`} data-book-side="right" data-page={staticRight + 1}>{leaf(staticRight, !turn)}</div>
      {!single && <div className={`${styles.staticPage} ${styles.left}`} data-book-side="left" data-page={staticLeft === null ? undefined : staticLeft + 1}>{leaf(staticLeft, !turn)}</div>}
      {!single && <div className={styles.spine} aria-hidden="true" />}
      {turn && <div className={`${styles.turnLeaf} ${turn.forward ? styles.forward : styles.backward}`} aria-hidden="true">
        <div className={`${styles.face} ${styles.front}`}>{leaf(front, false)}</div>
        <div className={`${styles.face} ${styles.back}`}>{leaf(back, false)}</div>
      </div>}
    </div>
  </div>;
});

export default RtlBook;
