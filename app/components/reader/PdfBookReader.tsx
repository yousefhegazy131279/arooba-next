"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PDFDocumentLoadingTask } from 'pdfjs-dist';
import RtlBook, { type RtlBookHandle } from './RtlBook';
import { useBookDimensions } from './useBookDimensions';
import { bookSpread } from '@/lib/book-layout';
import { nextPdfMatch, normalizePdfSearch, validPdfSearchIndex } from '@/lib/pdf-search';
import { addBookmark, deleteBookmark } from '@/app/reader/actions';
import { showToast } from '@/lib/toast';
import type { ReaderPage } from '@/lib/reader';
import BookmarkPanel from './BookmarkPanel';
import ReaderControls from './ReaderControls';
import { useReaderState } from './useReaderState';
import type { BookReaderProps } from './BookReader';
import styles from './reader.module.css';
import pdfStyles from './pdf-reader.module.css';

type Props = BookReaderProps & { fileUrl: string };

type PdfPageProps = {
  getCanvas: (pageNumber: number) => Promise<HTMLCanvasElement>;
  pageNumber: number;
  active: boolean;
  renderPage: boolean;
  width: number;
  height: number;
  brightness: number;
  theme: 'light' | 'dark' | 'sepia';
};


// Cache neighbouring paper surfaces so turning a leaf doesn't briefly show a loading screen.
function createPageRenderer(pdf: PDFDocumentProxy, width: number, height: number) {
  const cache = new Map<number, Promise<HTMLCanvasElement>>();
  return (number: number) => {
    const existing = cache.get(number);
    if (existing) return existing;
    const rendering = pdf.getPage(number).then(async page => {
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min((width - 16) / base.width, (height - 16) / base.height) });
      const canvas = window.document.createElement('canvas');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      await page.render({ canvas, canvasContext: context, viewport, transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0] }).promise;
      return canvas;
    }).catch(error => { cache.delete(number); throw error; });
    cache.set(number, rendering);
    // Keep only a few spreads in memory, even in a very long book.
    if (cache.size > 10) cache.delete(cache.keys().next().value!);
    return rendering;
  };
}

const PdfPage = forwardRef<HTMLDivElement, PdfPageProps>(function PdfPage(
  { getCanvas, pageNumber, active, renderPage, brightness, theme },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!renderPage) return;
    let cancelled = false;
    void getCanvas(pageNumber).then(rendered => {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = rendered.width;
      canvas.height = rendered.height;
      canvas.style.width = rendered.style.width;
      canvas.style.height = rendered.style.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(rendered, 0, 0);
      setReady(true);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [getCanvas, pageNumber, renderPage]);

  return (
    <div
      ref={ref}
      className={`${pdfStyles.pdfPage} ${pdfStyles[`pdfTheme_${theme}`]}`}
      aria-hidden={!active}
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {renderPage && <canvas ref={canvasRef} className={pdfStyles.pdfCanvas} aria-label={`صفحة ${pageNumber}`} />}
      {!ready && !failed && <div className={pdfStyles.pdfPlaceholder}>جارٍ تحميل الصفحة {pageNumber}…</div>}
      {failed && <div className={pdfStyles.pdfPlaceholder}>تعذر عرض الصفحة {pageNumber}</div>}
      <span className={pdfStyles.pdfPageNumber}>{pageNumber}</span>
    </div>
  );
});

export default function PdfBookReader({ fileUrl, chapterTitle, novelTitle, chapterId, novelId }: Props) {
  const state = useReaderState(chapterId, novelId);
  const flip = useRef<RtlBookHandle>(null);
  const textCache = useRef(new Map<number, string>());
  const indexedText = useRef(new Map<string, Promise<string[] | null>>());
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [total, setTotal] = useState(0);
  const [ratio, setRatio] = useState(.707);
  const [focused, setFocused] = useState(false);
  const { container, width, height, single } = useBookDimensions(ratio, focused);
  const [panel, setPanel] = useState<'settings' | 'bookmarks' | null>(null);
  const [loading, setLoading] = useState('جارٍ تحميل ملف الرواية…');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);

  const setPosition = state.setPosition;
  const readerReady = state.ready;
  const current = total ? Math.min(total - 1, Math.max(0, state.position)) : 0;
  const spread = bookSpread(current, total, single);
  const getCanvas = useMemo(() => document ? createPageRenderer(document, width, height) : null, [document, width, height]);
  useEffect(() => {
    if (!getCanvas) return;
    const step = single ? 1 : 2;
    for (let index = Math.max(0, spread.right - step); index < Math.min(total, spread.right + step * 2); index++)
      void getCanvas(index + 1).catch(() => {});
  }, [getCanvas, spread.right, single, total]);

  // تحميل مستند PDF
  useEffect(() => {
    let active = true;
    let task: PDFDocumentLoadingTask | null = null;
    textCache.current.clear();
    void import('pdfjs-dist')
      .then(pdfjs => {
        pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
        // Render embedded glyph outlines directly so Arabic ligatures survive browser font loading.
        task = pdfjs.getDocument({ url: fileUrl, disableFontFace: true });
        task.onProgress = ({ loaded: bytes, total: size }: { loaded: number; total: number }) => {
          if (active && size) setLoading(`جارٍ تحميل ملف الرواية… ${Math.round((bytes / size) * 100)}٪`);
        };
        return task.promise;
      })
      .then(async pdf => {
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        if (!active) return;
        setRatio(viewport.width / viewport.height);
        setDocument(pdf);
        setTotal(pdf.numPages);
        setLoading('');
      })
      .catch(() => { if (active) setError('تعذر تحميل صفحات الرواية.'); });
    return () => { active = false; if (task) void task.destroy(); };
  }, [fileUrl]);

  useEffect(() => { state.page.current = current + 1; }, [current, state.page]);

  const navigate = useCallback((index: number, animate = true) => {
    if (!total || index < 0 || index >= total) return;
    if (flip.current) flip.current.goTo(index, animate);
    else setPosition(index);
  }, [setPosition, total]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setFocused(false); return; }
      const target = event.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]') ||
          event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(spread.right + (single ? 1 : 2)); }
      if (event.key === 'ArrowRight') { event.preventDefault(); navigate(spread.right - (single ? 1 : 2)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spread.right, single, navigate]);

  useEffect(() => {
    if (!readerReady || !total) return;
    const match = window.location.hash.match(/^#page=(\d+)$/);
    if (!match) return;
    const page = Math.min(total, Math.max(1, Number(match[1]))) - 1;
    setPosition(page);
  }, [readerReady, setPosition, total]);

  async function pageText(pageNumber: number) {
    const cached = textCache.current.get(pageNumber);
    if (cached !== undefined) return cached;
    if (!document) return '';
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map(item => ('str' in item ? item.str : '')).join(' ');
    textCache.current.set(pageNumber, text);
    return text;
  }

  async function searchIndex() {
    const cached = indexedText.current.get(fileUrl);
    if (cached) return cached;
    const loading = (async () => {
      if (!/^\d+$/.test(chapterId)) return null;
      const response = await fetch(`/reader-search/${chapterId}.json`);
      if (!response.ok) return null;
      const value: unknown = await response.json();
      return validPdfSearchIndex(value, fileUrl, total) ? value.pages : null;
    })().catch(() => null);
    indexedText.current.set(fileUrl, loading);
    return loading;
  }

  async function findNext() {
    const needle = normalizePdfSearch(query);
    if (!needle || !document || searching) return;
    setSearching(true);
    try {
      const indexed = await searchIndex();
      const ocrMatch = indexed ? nextPdfMatch(indexed, needle, current) : null;
      if (ocrMatch !== null) {
        navigate(ocrMatch);
        showToast.success(`تم العثور على العبارة في الصفحة ${ocrMatch + 1}`);
        return;
      }
      for (let step = 1; step <= total; step++) {
        const index = (current + step) % total;
        if (normalizePdfSearch(await pageText(index + 1)).includes(needle)) {
          navigate(index);
          showToast.success(`تم العثور على العبارة في الصفحة ${index + 1}`);
          return;
        }
      }
      showToast.error('لم يتم العثور على العبارة.');
    } catch { showToast.error('تعذر البحث داخل الملف.'); }
    finally { setSearching(false); }
  }

  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await action(); }
    catch (caught) { showToast.error(caught instanceof Error ? caught.message : 'تعذر إكمال العملية'); }
    finally { setBusy(false); }
  }

  async function sharePage() {
    const url = new URL(window.location.href);
    url.hash = `page=${current + 1}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${novelTitle} — ${chapterTitle}`, text: `صفحة ${current + 1}`, url: url.toString() });
      } else {
        await navigator.clipboard.writeText(url.toString());
        showToast.success('تم نسخ رابط الصفحة');
      }
    } catch (caught) {
      if (!(caught instanceof Error && caught.name === 'AbortError'))
        showToast.error('تعذرت مشاركة الصفحة.');
    }
  }

  const bookmarkPages = useMemo<ReaderPage[]>(
    () => Array.from({ length: total }, (_, i) => ({ text: '', start: i, end: i + 1 })),
    [total]
  );

  return (
    <section className={`${styles.reader} ${focused ? styles.focused : ''}`} dir="rtl" aria-label="قارئ ملف الرواية">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>{novelTitle}</span>
          <h1>{chapterTitle}</h1>
          <p className={pdfStyles.readerLead}>اقرأ من الصفحة اليمنى إلى اليسرى، واقلب الورقة لتكمل الحكاية.</p>
        </div>
        <div className={styles.toolbar}>
          <button aria-pressed={focused} onClick={() => setFocused(!focused)}>{focused ? 'الخروج من وضع القراءة' : 'وضع القراءة'}</button>
          <button aria-expanded={panel === 'settings'} onClick={() => setPanel(panel === 'settings' ? null : 'settings')}>
            إعدادات العرض
          </button>
          <button aria-expanded={panel === 'bookmarks'} onClick={() => setPanel(panel === 'bookmarks' ? null : 'bookmarks')}>
            الفواصل
          </button>
          <button onClick={() => void sharePage()} disabled={!total}>مشاركة الصفحة</button>
        </div>
      </header>

      <form
        className={styles.searchRow}
        onSubmit={event => { event.preventDefault(); void findNext(); }}
      >
        <label htmlFor="pdf-search">بحث داخل الرواية</label>
        <input
          id="pdf-search"
          type="search"
          maxLength={200}
          placeholder="ابحث عن كلمة أو عبارة…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <button disabled={!query.trim() || searching || !document}>
          {searching ? 'جارٍ البحث…' : 'النتيجة التالية'}
        </button>
      </form>

      {panel === 'settings' && <fieldset className={styles.settings}><legend>راحة القراءة</legend><label>خلفية الورق<select value={state.settings.theme} onChange={event => state.setSettings({ ...state.settings, theme: event.target.value as 'light' | 'dark' | 'sepia' })}><option value="light">نهاري</option><option value="sepia">ورق دافئ</option><option value="dark">ليلي</option></select></label><label>السطوع {state.settings.brightness}%<input aria-label="السطوع" type="range" min="40" max="100" value={state.settings.brightness} onChange={event => state.setSettings({ ...state.settings, brightness: Number(event.target.value) })} /></label></fieldset>}

      <div className={styles.layout}>
        <div className={styles.readingArea}>
          <div ref={container} className={styles.bookContainer}>
            {error ? (
              <div className={pdfStyles.readerMessage} role="alert">{error}</div>
            ) : !document || !getCanvas || !state.ready ? (
              <div className={styles.skeleton} role="status">
                <span /><span /><span /><span />
                <p>{loading || 'جارٍ استعادة موضع القراءة…'}</p>
              </div>
            ) : (
              <RtlBook
                ref={flip}
                width={width}
                height={height}
                single={single}
                page={current}
                total={total}
                onChange={setPosition}
                renderPage={(index, active) => <PdfPage key={`${index}-${width}-${height}`} pageNumber={index + 1} active={active} renderPage width={width} height={height} brightness={state.settings.brightness} theme={state.settings.theme} getCanvas={getCanvas} />}
              />
            )}
          </div>

          {total > 0 && <ReaderControls page={spread.right} endPage={spread.left} step={single ? 1 : 2} total={total} onChange={navigate} />}
          <p className={styles.hint}>للتالي اسحب الصفحة اليسرى نحو اليمين، أو استخدم السهم الأيسر. للسابق استخدم السهم الأيمن.</p>
          <p className={styles.status} role="status">
            {state.status}
            {state.ready && state.userId && !state.cloudReady && (
              <button onClick={state.retry}>إعادة المزامنة</button>
            )}
          </p>
        </div>

        {panel === 'bookmarks' && (
          <BookmarkPanel
            bookmarks={state.bookmarks}
            highlights={[]}
            pages={bookmarkPages}
            busy={busy}
            onJump={position => navigate(position, false)}
            onAdd={note =>
              void perform(() =>
                state.mutate(
                  id => addBookmark({ chapterId, page: current + 1, position: current, note }, id),
                  bookmark => {
                    state.setBookmarks(items => [bookmark, ...items]);
                    showToast.success('تمت إضافة الفاصل');
                  }
                )
              )
            }
            onDelete={bookmarkId =>
              void perform(() =>
                state.mutate(
                  id => deleteBookmark(bookmarkId, id),
                  () => state.setBookmarks(items => items.filter(item => item.id !== bookmarkId))
                )
              )
            }
            onDeleteHighlight={() => undefined}
          />
        )}
      </div>
    </section>
  );
}
