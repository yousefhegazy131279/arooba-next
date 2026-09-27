'use client';
import { forwardRef } from 'react';
import type { Highlight, ReaderPage, ReaderSettings } from '@/lib/reader';
import styles from './reader.module.css';

type Props = { page: ReaderPage; number: number; active: boolean; settings: ReaderSettings; highlights: Highlight[]; matches: { start: number; end: number }[]; onShare: (text: string, offset: number) => void };
const BookPage = forwardRef<HTMLDivElement, Props>(function BookPage({ page, number, active, settings, highlights, matches, onShare }, ref) {
  const paragraphs = [...page.text.matchAll(/[^\n]+(?:\n+|$)|\n+/g)].map(match => ({ text: match[0], start: page.start + match.index! }));
  return <div ref={ref} className={styles.bookPage} data-theme={settings.theme} aria-hidden={!active} style={{ fontFamily: settings.font_family, fontSize: settings.font_size === 'small' ? 18 : settings.font_size === 'large' ? 28 : 23, filter: `brightness(${settings.brightness}%)` }}>
    <div className={styles.pageKicker}>عُروبة <span>مساحةٌ لحكاية أخرى</span></div>
    <div className={styles.pageText} tabIndex={active ? 0 : -1} aria-label={`نص الصفحة ${number}`}>
      {paragraphs.map(paragraph => {
        const end = paragraph.start + paragraph.text.length;
        const layers = highlights.filter(item => item.start_offset < end && item.end_offset > paragraph.start);
        const hits = matches.filter(item => item.start < end && item.end > paragraph.start);
        const boundaries = [...new Set([paragraph.start, end, ...layers.flatMap(item => [Math.max(paragraph.start, item.start_offset), Math.min(end, item.end_offset)]), ...hits.flatMap(item => [Math.max(paragraph.start, item.start), Math.min(end, item.end)])])].sort((a, b) => a - b);
        return <div className={styles.paragraph} key={paragraph.start}>
          <span data-reader-segment="true" data-start={paragraph.start}>{boundaries.slice(0, -1).map((start, index) => {
            const stop = boundaries[index + 1];
            const value = paragraph.text.slice(start - paragraph.start, stop - paragraph.start);
            const hit = hits.some(item => item.start <= start && item.end >= stop);
            const layer = layers.findLast(item => item.start_offset <= start && item.end_offset >= stop);
            return hit || layer ? <mark key={start} data-color={hit ? 'search' : layer?.color}>{value}</mark> : <span key={start}>{value}</span>;
          })}</span>
          {paragraph.text.trim() && <button tabIndex={active ? 0 : -1} className={styles.share} aria-label="مشاركة هذه الفقرة" title="مشاركة الفقرة" onClick={() => onShare(paragraph.text.trim(), paragraph.start)}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg></button>}
        </div>;
      })}
    </div>
    <div className={styles.pageNumber}>{number}</div>
  </div>;
});
export default BookPage;
