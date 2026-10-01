'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RtlBook, { type RtlBookHandle } from './RtlBook';
import { useBookDimensions } from './useBookDimensions';
import { bookSpread } from '@/lib/book-layout';
import {
  addBookmark,
  addHighlight,
  deleteBookmark,
  deleteHighlight,
} from '@/app/reader/actions';
import {
  normalizeReaderContent,
  paginateContent,
  pageForPosition,
  searchChapter,
  type Highlight,
} from '@/lib/reader';
import { showToast } from '@/lib/toast';
import BookPage from './BookPage';
import ReaderControls from './ReaderControls';
import ReaderSettings from './ReaderSettings';
import BookmarkPanel from './BookmarkPanel';
import { useReaderState } from './useReaderState';
import styles from './reader.module.css';

export type BookReaderProps = {
  content: string;
  chapterTitle: string;
  novelTitle: string;
  chapterId: string;
  novelId: string;
};

/* ==========================================================
   أيقونات SVG
   ========================================================== */
const Icons = {
  expand: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  ),
  collapse: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  bookmark: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  book: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  simple: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="15" y2="18" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  chevronLeft: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  arrowDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  empty: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
};

export default function BookReader({
  content,
  chapterTitle,
  novelTitle,
  chapterId,
  novelId,
}: BookReaderProps) {
  const state = useReaderState(chapterId, novelId);
  const setPosition = state.setPosition;
  const text = useMemo(() => normalizeReaderContent(content), [content]);
  const flip = useRef<RtlBookHandle>(null);
  const [focused, setFocused] = useState(false);
  const { container, width, height, single } = useBookDimensions(0.707, focused);
  const [panel, setPanel] = useState<'settings' | 'bookmarks' | null>(null);
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [simple, setSimple] = useState(false);

  const fontSize =
    state.settings.font_size === 'small'
      ? 18
      : state.settings.font_size === 'large'
      ? 28
      : 23;

  const capacity = Math.max(
    150,
    Math.floor(
      ((width - 72) / (fontSize * 0.63)) *
        ((height - 128) / (fontSize * 1.9))
    )
  );

  const pages = useMemo(() => paginateContent(text, capacity), [text, capacity]);
  const current = pageForPosition(pages, state.position);
  const spread = bookSpread(current, pages.length, single || simple);
  const matches = useMemo(() => searchChapter(text, query), [text, query]);

  const validHighlights = useMemo(
    () =>
      state.highlights.filter(
        (item) => text.slice(item.start_offset, item.end_offset) === item.text
      ),
    [state.highlights, text]
  );

  const currentMatch = matches.findIndex(
    (item) => item.start >= pages[current].start
  );

  useEffect(() => {
    state.page.current = current + 1;
  }, [current, state.page]);

  const navigate = useCallback(
    (index: number, animate = true) => {
      if (index < 0 || index >= pages.length) return;
      setSelection(null);
      window.getSelection()?.removeAllRanges();
      if (simple || !flip.current) setPosition(pages[index].start);
      else flip.current.goTo(index, animate);
    },
    [pages, simple, setPosition]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFocused(false);
        return;
      }
      const target = event.target as HTMLElement;
      if (
        target.closest('input,textarea,select,[contenteditable="true"]') ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        window.getSelection()?.toString()
      )
        return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigate(spread.right + (single || simple ? 1 : 2));
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigate(spread.right - (single || simple ? 1 : 2));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spread.right, single, simple, navigate]);

  function captureSelection() {
    const selected = window.getSelection();
    if (!selected || selected.isCollapsed || !selected.rangeCount) return;
    const range = selected.getRangeAt(0);
    const getOffset = (node: Node, offset: number) => {
      const element = (
        node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
      )?.closest<HTMLElement>('[data-reader-segment]');
      if (
        !element ||
        !container.current?.contains(element) ||
        element.closest('[aria-hidden="true"]')
      )
        return null;
      const prefix = document.createRange();
      prefix.selectNodeContents(element);
      prefix.setEnd(node, offset);
      return Number(element.dataset.start) + prefix.toString().length;
    };
    const start = getOffset(range.startContainer, range.startOffset);
    const end = getOffset(range.endContainer, range.endOffset);
    if (start !== null && end !== null && end > start && end - start <= 5000)
      setSelection({ start, end });
  }

  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : 'تعذر إكمال العملية'
      );
    } finally {
      setBusy(false);
    }
  }

  async function share(paragraph: string, offset: number) {
    const url = new URL(window.location.href);
    url.hash = `position=${offset}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: `${novelTitle} — ${chapterTitle}`,
          text: paragraph,
          url: url.toString(),
        });
      else {
        await navigator.clipboard.writeText(
          `${paragraph}\n\n${novelTitle} — ${chapterTitle}\n${url}`
        );
        showToast.success('تم نسخ الفقرة ورابطها');
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError'))
        showToast.error('تعذرت المشاركة. يمكنك تحديد النص ونسخه.');
    }
  }

  useEffect(() => {
    if (!state.ready) return;
    const match = window.location.hash.match(/^#position=(\d+)$/);
    if (match) {
      const position = Math.min(text.length, Number(match[1]));
      state.setPosition(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ready, chapterId, state.userId]);

  function jumpToPosition(position: number) {
    navigate(pageForPosition(pages, position), false);
  }

  const pageProps = {
    settings: state.settings,
    highlights: validHighlights,
    matches,
    onShare: share,
  };

  return (
    <section
      className={`${styles.reader} ${focused ? styles.focused : ''}`}
      dir="rtl"
      aria-label="قارئ الفصل"
    >
      {/* ===== الرأس ===== */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.eyebrow}>{novelTitle}</span>
          <h1>{chapterTitle}</h1>
        </div>

        <div className={styles.toolbar}>
          <button
            className={`${styles.toolBtn} ${focused ? styles.toolBtnActive : ''}`}
            aria-pressed={focused}
            onClick={() => setFocused(!focused)}
            title={focused ? 'الخروج من وضع القراءة' : 'وضع القراءة'}
          >
            {focused ? Icons.collapse : Icons.expand}
            <span>{focused ? 'خروج' : 'وضع القراءة'}</span>
          </button>

          <button
            className={`${styles.toolBtn} ${panel === 'settings' ? styles.toolBtnActive : ''}`}
            aria-expanded={panel === 'settings'}
            onClick={() => setPanel(panel === 'settings' ? null : 'settings')}
            title="إعدادات القراءة"
          >
            {Icons.settings}
            <span>الإعدادات</span>
          </button>

          <button
            className={`${styles.toolBtn} ${panel === 'bookmarks' ? styles.toolBtnActive : ''}`}
            aria-expanded={panel === 'bookmarks'}
            onClick={() => setPanel(panel === 'bookmarks' ? null : 'bookmarks')}
            title="الفواصل والتظليلات"
          >
            {Icons.bookmark}
            <span>الفواصل</span>
          </button>

          <button
            className={`${styles.toolBtn} ${simple ? styles.toolBtnActive : ''}`}
            aria-pressed={simple}
            onClick={() => setSimple(!simple)}
            title={simple ? 'تقليب الصفحات' : 'قراءة مبسطة'}
          >
            {simple ? Icons.book : Icons.simple}
            <span>{simple ? 'تقليب' : 'بسيط'}</span>
          </button>
        </div>
      </header>

      {/* ===== البحث ===== */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>{Icons.search}</span>
          <input
            id="chapter-search"
            type="search"
            maxLength={200}
            placeholder="ابحث في الفصل…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="بحث في الفصل"
          />
          {query && (
            <button
              className={styles.searchClear}
              onClick={() => setQuery('')}
              aria-label="مسح البحث"
            >
              {Icons.close}
            </button>
          )}
        </div>

        {query.trim() && (
          <div className={styles.searchResults}>
            <span className={styles.searchCount} role="status">
              {matches.length > 0
                ? `${currentMatch + 1} من ${matches.length}`
                : 'لا نتائج'}
            </span>
            {matches.length > 0 && (
              <button
                className={styles.searchNextBtn}
                onClick={() => {
                  const next =
                    matches.find((item) => item.start > state.position) ||
                    matches[0];
                  if (next) jumpToPosition(next.start);
                }}
              >
                <span>التالي</span>
                {Icons.arrowDown}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== لوحة الإعدادات ===== */}
      {panel === 'settings' && (
        <ReaderSettings settings={state.settings} onChange={state.setSettings} />
      )}

      {/* ===== منطقة القراءة ===== */}
      <div className={styles.layout}>
        <div className={styles.readingArea}>
          <div
            ref={container}
            className={styles.bookContainer}
            onMouseUp={captureSelection}
            onTouchEnd={captureSelection}
          >
            {!state.ready ? (
              <ReaderSkeleton />
            ) : !text ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>{Icons.empty}</span>
                <p>لا يوجد نص لهذا الفصل.</p>
              </div>
            ) : simple ? (
              <div style={{ width, height }}>
                <BookPage page={pages[current]} number={current + 1} active {...pageProps} />
              </div>
            ) : (
              <RtlBook
                ref={flip}
                page={current}
                total={pages.length}
                width={width}
                height={height}
                single={single}
                onChange={(index) => state.setPosition(pages[index].start)}
                renderPage={(index, active) => (
                  <BookPage
                    page={pages[index]}
                    number={index + 1}
                    active={active}
                    {...pageProps}
                  />
                )}
              />
            )}
          </div>

          {/* ===== شريط التظليل ===== */}
          {selection && (
            <div
              className={styles.selectionBar}
              role="toolbar"
              aria-label="تظليل النص المحدد"
            >
              <span className={styles.selectionLabel}>تظليل:</span>
              {(['yellow', 'green', 'blue', 'pink'] as const).map(
                (color, index) => (
                  <button
                    key={color}
                    data-color={color}
                    className={styles.selectionColor}
                    aria-label={
                      ['تظليل أصفر', 'تظليل أخضر', 'تظليل أزرق', 'تظليل وردي'][index]
                    }
                    disabled={busy}
                    onClick={() =>
                      void perform(() =>
                        state.mutate(
                          (id) =>
                            addHighlight(
                              { chapterId, ...selection, color: color as Highlight['color'] },
                              id
                            ),
                          (highlight) => {
                            state.setHighlights((items) => [...items, highlight]);
                            setSelection(null);
                            window.getSelection()?.removeAllRanges();
                            showToast.success('تم حفظ التظليل');
                          }
                        )
                      )
                    }
                  />
                )
              )}
              <button
                className={styles.selectionCancel}
                onClick={() => setSelection(null)}
                aria-label="إلغاء"
              >
                {Icons.close}
              </button>
            </div>
          )}

          {/* ===== أزرار التنقل ===== */}
          <ReaderControls
            page={spread.right}
            endPage={spread.left}
            step={single || simple ? 1 : 2}
            total={pages.length}
            onChange={navigate}
          />

          {/* ===== تلميح ===== */}
          <p className={styles.hint}>
            اقرأ من اليمين إلى اليسار · اسحب يميناً للتالي · السهم الأيسر للتالي · السهم الأيمن للسابق
          </p>

          {/* ===== الحالة ===== */}
          <p className={styles.status} role="status">
            {state.status}
            {state.ready && state.userId && !state.cloudReady && (
              <button onClick={state.retry}>إعادة المزامنة</button>
            )}
          </p>
        </div>

        {/* ===== لوحة الفواصل ===== */}
        {panel === 'bookmarks' && (
          <BookmarkPanel
            bookmarks={state.bookmarks}
            highlights={validHighlights}
            pages={pages}
            busy={busy}
            onJump={jumpToPosition}
            onAdd={(note) =>
              void perform(() =>
                state.mutate(
                  (id) =>
                    addBookmark(
                      {
                        chapterId,
                        page: current + 1,
                        position: pages[current].start,
                        note,
                      },
                      id
                    ),
                  (bookmark) => {
                    state.setBookmarks((items) => [bookmark, ...items]);
                    showToast.success('تمت إضافة الفاصل');
                  }
                )
              )
            }
            onDelete={(bookmarkId) =>
              void perform(() =>
                state.mutate(
                  (id) => deleteBookmark(bookmarkId, id),
                  () =>
                    state.setBookmarks((items) =>
                      items.filter((item) => item.id !== bookmarkId)
                    )
                )
              )
            }
            onDeleteHighlight={(highlightId) =>
              void perform(() =>
                state.mutate(
                  (id) => deleteHighlight(highlightId, id),
                  () =>
                    state.setHighlights((items) =>
                      items.filter((item) => item.id !== highlightId)
                    )
                )
              )
            }
          />
        )}
      </div>
    </section>
  );
}

/* ==========================================================
   Skeleton
   ========================================================== */
export function ReaderSkeleton() {
  return (
    <div
      className={styles.skeleton}
      role="status"
      aria-label="جارٍ تحميل القارئ"
    >
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <p>جارٍ تجهيز صفحات الحكاية…</p>
    </div>
  );
}