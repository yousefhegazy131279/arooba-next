'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useGesture } from '@use-gesture/react';
import { addBookmark, addHighlight, deleteBookmark, deleteHighlight } from '@/app/reader/actions';
import { normalizeReaderContent, paginateContent, pageForPosition, searchChapter, type Highlight } from '@/lib/reader';
import { showToast } from '@/lib/toast';
import BookPage from './BookPage';
import ReaderControls from './ReaderControls';
import ReaderSettings from './ReaderSettings';
import BookmarkPanel from './BookmarkPanel';
import { useReaderState } from './useReaderState';
import styles from './reader.module.css';

export type BookReaderProps = { content: string; chapterTitle: string; novelTitle: string; chapterId: string; novelId: string };
type FlipHandle = { pageFlip: () => { flip: (index: number) => void; turnToPage: (index: number) => void; getCurrentPageIndex: () => number } };

export default function BookReader({ content, chapterTitle, novelTitle, chapterId, novelId }: BookReaderProps) {
  const state = useReaderState(chapterId, novelId);
  const text = useMemo(() => normalizeReaderContent(content), [content]);
  const container = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipHandle>(null);
  const [width, setWidth] = useState(520);
  const [height, setHeight] = useState(640);
  const [panel, setPanel] = useState<'settings' | 'bookmarks' | null>(null);
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [simple, setSimple] = useState(false);
  const fontSize = state.settings.font_size === 'small' ? 18 : state.settings.font_size === 'large' ? 28 : 23;
  const capacity = Math.max(150, Math.floor(((width - 72) / (fontSize * .63)) * ((height - 128) / (fontSize * 1.9))));
  const pages = useMemo(() => paginateContent(text, capacity), [text, capacity]);
  const current = pageForPosition(pages, state.position);
  const matches = useMemo(() => searchChapter(text, query), [text, query]);
  const validHighlights = useMemo(() => state.highlights.filter(item => text.slice(item.start_offset, item.end_offset) === item.text), [state.highlights, text]);
  const currentMatch = matches.findIndex(item => item.start >= pages[current].start);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      const available = entries[0]?.contentRect.width || 520;
      setWidth(Math.max(240, Math.min(560, Math.floor(available))));
      setHeight(Math.max(420, Math.min(720, Math.floor(window.innerHeight * .72))));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { state.page.current = current + 1; }, [current, state.page]);

  const navigate = useCallback((index: number, animate = true) => {
    if (index < 0 || index >= pages.length) return;
    setSelection(null);
    window.getSelection()?.removeAllRanges();
    state.setPosition(pages[index].start);
    if (!simple && flip.current) {
      const controller = flip.current.pageFlip();
      if (controller) {
        if (animate) controller.flip(pages.length - 1 - index);
        else controller.turnToPage(pages.length - 1 - index);
      }
    }
  }, [pages, simple, state.setPosition]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]') || event.ctrlKey || event.altKey || event.metaKey || window.getSelection()?.toString()) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(current + 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); navigate(current - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, navigate]);

  // Turn only using deliberate horizontal gestures; vertical gestures remain native scrolling.
  const swipe = useGesture({ onDrag: ({ direction: [x], event }) => {
    if (window.getSelection()?.toString() || (event.target as HTMLElement).closest('button,input,select,textarea')) return;
    navigate(current + (x > 0 ? 1 : -1));
  } }, { drag: { threshold: 70, axis: 'x', filterTaps: true } });

  function captureSelection() {
    const selected = window.getSelection();
    if (!selected || selected.isCollapsed || !selected.rangeCount) return;
    const range = selected.getRangeAt(0);
    const getOffset = (node: Node, offset: number) => {
      const element = (node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement)?.closest<HTMLElement>('[data-reader-segment]');
      if (!element || !container.current?.contains(element) || element.closest('[aria-hidden="true"]')) return null;
      const prefix = document.createRange();
      prefix.selectNodeContents(element);
      prefix.setEnd(node, offset);
      return Number(element.dataset.start) + prefix.toString().length;
    };
    const start = getOffset(range.startContainer, range.startOffset);
    const end = getOffset(range.endContainer, range.endOffset);
    if (start !== null && end !== null && end > start && end - start <= 5000) setSelection({ start, end });
  }

  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await action(); }
    catch (error) { showToast.error(error instanceof Error ? error.message : 'تعذر إكمال العملية'); }
    finally { setBusy(false); }
  }

  async function share(paragraph: string, offset: number) {
    const url = new URL(window.location.href);
    url.hash = `position=${offset}`;
    try {
      if (navigator.share) await navigator.share({ title: `${novelTitle} — ${chapterTitle}`, text: paragraph, url: url.toString() });
      else { await navigator.clipboard.writeText(`${paragraph}\n\n${novelTitle} — ${chapterTitle}\n${url}`); showToast.success('تم نسخ الفقرة ورابطها'); }
    } catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) showToast.error('تعذرت المشاركة. يمكنك تحديد النص ونسخه.'); }
  }

  useEffect(() => {
    if (!state.ready) return;
    const match = window.location.hash.match(/^#position=(\d+)$/);
    if (match) {
      const position = Math.min(text.length, Number(match[1]));
      state.setPosition(position);
      // Initial page mounting picks up the restored position on the next frame.
      requestAnimationFrame(() => flip.current?.pageFlip()?.turnToPage(pages.length - 1 - pageForPosition(pages, position)));
    }
    // The deep link is applied once per account/chapter, never again on font changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ready, chapterId, state.userId]);

  function jumpToPosition(position: number) { navigate(pageForPosition(pages, position), false); }
  const bookKey = `${width}-${height}-${capacity}-${state.userId || 'guest'}`;
  const pageProps = { settings: state.settings, highlights: validHighlights, matches, onShare: share };

  return <section className={styles.reader} dir="rtl" aria-label="قارئ الفصل">
    <header className={styles.header}><div><span className={styles.eyebrow}>{novelTitle}</span><h1>{chapterTitle}</h1></div><div className={styles.toolbar}><button aria-expanded={panel === 'settings'} onClick={() => setPanel(panel === 'settings' ? null : 'settings')}>إعدادات القراءة</button><button aria-expanded={panel === 'bookmarks'} onClick={() => setPanel(panel === 'bookmarks' ? null : 'bookmarks')}>الفواصل والتظليلات</button><button aria-pressed={simple} onClick={() => setSimple(!simple)}>{simple ? 'تقليب الصفحات' : 'قراءة مبسطة'}</button></div></header>
    <div className={styles.searchRow}><label htmlFor="chapter-search">بحث في الفصل</label><input id="chapter-search" type="search" maxLength={200} placeholder="ابحث عن كلمة أو عبارة…" value={query} onChange={event => setQuery(event.target.value)} />{query.trim() && <><span role="status">{matches.length} نتيجة</span><button disabled={!matches.length} onClick={() => { const next = matches.find(item => item.start > state.position) || matches[0]; if (next) jumpToPosition(next.start); }}>النتيجة التالية{currentMatch >= 0 ? ` (${currentMatch + 1})` : ''}</button></>}</div>
    {panel === 'settings' && <ReaderSettings settings={state.settings} onChange={state.setSettings} />}
    <div className={styles.layout}>
      <div className={styles.readingArea}>
        <div ref={container} className={styles.bookContainer} {...swipe()} onMouseUp={captureSelection} onTouchEnd={captureSelection}>
          {!state.ready ? <ReaderSkeleton /> : !text ? <p className={styles.empty}>لا يوجد نص لهذا الفصل.</p> : simple || pages.length === 1 ? <div style={{ width, height }}><BookPage page={pages[current]} number={current + 1} active {...pageProps} /></div> : <HTMLFlipBook key={bookKey} ref={flip} className={styles.flipBook} style={{}} width={width} height={height} size="fixed" minWidth={width} maxWidth={width} minHeight={height} maxHeight={height} startPage={pages.length - 1 - current} drawShadow flippingTime={360} usePortrait startZIndex={1} autoSize={false} maxShadowOpacity={.18} showCover={false} mobileScrollSupport={false} clickEventForward useMouseEvents={false} swipeDistance={70} showPageCorners={false} disableFlipByClick onFlip={(event: { data: number }) => { const index = pages.length - 1 - event.data; if (pages[index]) state.setPosition(pages[index].start); }}>
            {[...pages].reverse().map((page, index) => <BookPage key={page.start} page={page} number={pages.length - index} active={pages.length - index - 1 === current} {...pageProps} />)}
          </HTMLFlipBook>}
        </div>
        {selection && <div className={styles.selectionBar} role="toolbar" aria-label="تظليل النص المحدد"><span>تظليل النص:</span>{(['yellow', 'green', 'blue', 'pink'] as const).map((color, index) => <button key={color} data-color={color} aria-label={['تظليل أصفر', 'تظليل أخضر', 'تظليل أزرق', 'تظليل وردي'][index]} disabled={busy} onClick={() => void perform(() => state.mutate(id => addHighlight({ chapterId, ...selection, color: color as Highlight['color'] }, id), highlight => { state.setHighlights(items => [...items, highlight]); setSelection(null); window.getSelection()?.removeAllRanges(); showToast.success('تم حفظ التظليل'); }))} />)}<button onClick={() => setSelection(null)}>إلغاء</button></div>}
        <ReaderControls page={current} total={pages.length} onChange={navigate} />
        <p className={styles.hint}>السهم الأيسر للتالي، والأيمن للسابق. اسحب أفقياً للتقليب، ومرّر داخل الصفحة إذا طال النص.</p>
        <p className={styles.status} role="status">{state.status}{state.ready && state.userId && !state.cloudReady && <button onClick={state.retry}>إعادة المزامنة</button>}</p>
      </div>
      {panel === 'bookmarks' && <BookmarkPanel bookmarks={state.bookmarks} highlights={validHighlights} pages={pages} busy={busy} onJump={jumpToPosition} onAdd={note => void perform(() => state.mutate(id => addBookmark({ chapterId, page: current + 1, position: pages[current].start, note }, id), bookmark => { state.setBookmarks(items => [bookmark, ...items]); showToast.success('تمت إضافة الفاصل'); }))} onDelete={bookmarkId => void perform(() => state.mutate(id => deleteBookmark(bookmarkId, id), () => state.setBookmarks(items => items.filter(item => item.id !== bookmarkId))))} onDeleteHighlight={highlightId => void perform(() => state.mutate(id => deleteHighlight(highlightId, id), () => state.setHighlights(items => items.filter(item => item.id !== highlightId))))} />}
    </div>
  </section>;
}

export function ReaderSkeleton() {
  return <div className={styles.skeleton} role="status" aria-label="جارٍ تحميل القارئ"><span /><span /><span /><span /><span /><span /><p>جارٍ تجهيز صفحات الحكاية…</p></div>;
}
