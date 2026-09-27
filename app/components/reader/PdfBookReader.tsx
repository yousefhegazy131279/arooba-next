'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useGesture } from '@use-gesture/react';
import { addBookmark, deleteBookmark } from '@/app/reader/actions';
import { showToast } from '@/lib/toast';
import type { ReaderPage } from '@/lib/reader';
import BookmarkPanel from './BookmarkPanel';
import ReaderControls from './ReaderControls';
import ReaderSettings from './ReaderSettings';
import { useReaderState } from './useReaderState';
import type { BookReaderProps } from './BookReader';
import styles from './reader.module.css';
import pdfStyles from './pdf-reader.module.css';

type Props = BookReaderProps & { fileUrl: string };
type FlipHandle = { pageFlip: () => { flip: (index: number) => void; turnToPage: (index: number) => void } };

type PdfPageProps = {
  document: PDFDocumentProxy;
  pageNumber: number;
  active: boolean;
  renderPage: boolean;
  width: number;
  height: number;
  brightness: number;
  theme: 'light' | 'dark' | 'sepia';
};

const PdfPage = forwardRef<HTMLDivElement, PdfPageProps>(function PdfPage({ document, pageNumber, active, renderPage, width, height, brightness, theme }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!renderPage) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    void document.getPage(pageNumber).then(page => {
      if (cancelled || !canvasRef.current) return;
      const base = page.getViewport({ scale: 1 });
      const scale = Math.max(.25, Math.min((width - 28) / base.width, (height - 48) / base.height));
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable');
      task = page.render({ canvas, canvasContext: context, viewport, transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0] });
      return task.promise;
    }).then(() => { if (!cancelled) setReady(true); }).catch(error => {
      if (!cancelled && !(error instanceof Error && error.name === 'RenderingCancelledException')) setFailed(true);
    });
    return () => { cancelled = true; task?.cancel(); };
  }, [document, pageNumber, renderPage, width, height]);

  return <div ref={ref} className={`${pdfStyles.pdfPage} ${pdfStyles[`pdfTheme_${theme}`]}`} aria-hidden={!active} style={{ filter: `brightness(${brightness}%)` }}>
    {renderPage && <canvas ref={canvasRef} className={pdfStyles.pdfCanvas} aria-label={`صفحة ${pageNumber}`} />}
    {!ready && !failed && <div className={pdfStyles.pdfPlaceholder}>جارٍ تحميل الصفحة {pageNumber}…</div>}
    {failed && <div className={pdfStyles.pdfPlaceholder}>تعذر عرض الصفحة {pageNumber}</div>}
    <span className={pdfStyles.pdfPageNumber}>{pageNumber}</span>
  </div>;
});

export default function PdfBookReader({ fileUrl, chapterTitle, novelTitle, chapterId, novelId }: Props) {
  const state = useReaderState(chapterId, novelId);
  const container = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipHandle>(null);
  const textCache = useRef(new Map<number, string>());
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [total, setTotal] = useState(0);
  const [width, setWidth] = useState(560);
  const [height, setHeight] = useState(760);
  const [panel, setPanel] = useState<'settings' | 'bookmarks' | null>(null);
  const [loading, setLoading] = useState('جارٍ تحميل ملف الرواية…');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const setPosition = state.setPosition;
  const readerReady = state.ready;
  const current = total ? Math.min(total - 1, Math.max(0, state.position)) : 0;

  useEffect(() => {
    let active = true;
    let loaded: PDFDocumentProxy | null = null;
    setError('');
    setLoading('جارٍ تحميل ملف الرواية…');
    textCache.current.clear();
    void import('pdfjs-dist').then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
      const task = pdfjs.getDocument({ url: fileUrl });
      task.onProgress = ({ loaded: bytes, total: size }: { loaded: number; total: number }) => {
        if (active && size) setLoading(`جارٍ تحميل ملف الرواية… ${Math.round((bytes / size) * 100)}٪`);
      };
      return task.promise;
    }).then(pdf => {
      if (!active) { void pdf.cleanup(); return; }
      loaded = pdf;
      setDocument(pdf);
      setTotal(pdf.numPages);
      setLoading('');
    }).catch(() => {
      if (active) setError('تعذر تحميل صفحات الرواية. يمكنك فتح الملف الأصلي من الرابط أعلى القارئ.');
    });
    return () => { active = false; if (loaded) void loaded.cleanup(); };
  }, [fileUrl]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      const available = entries[0]?.contentRect.width || 560;
      setWidth(Math.max(260, Math.min(620, Math.floor(available))));
      setHeight(Math.max(440, Math.min(820, Math.floor(window.innerHeight * .78))));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { state.page.current = current + 1; }, [current, state.page]);

  const navigate = useCallback((index: number, animate = true) => {
    if (!total || index < 0 || index >= total) return;
    setPosition(index);
    const controller = flip.current?.pageFlip();
    if (controller) {
      const target = total - 1 - index;
      if (animate) controller.flip(target);
      else controller.turnToPage(target);
    }
  }, [setPosition, total]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]') || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(current + 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); navigate(current - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, navigate]);

  useEffect(() => {
    if (!readerReady || !total) return;
    const match = window.location.hash.match(/^#page=(\d+)$/);
    if (!match) return;
    const page = Math.min(total, Math.max(1, Number(match[1]))) - 1;
    setPosition(page);
    requestAnimationFrame(() => flip.current?.pageFlip()?.turnToPage(total - 1 - page));
  }, [readerReady, setPosition, total]);

  const swipe = useGesture({ onDrag: ({ direction: [x], event }) => {
    if ((event.target as HTMLElement).closest('button,input,select,textarea')) return;
    navigate(current + (x > 0 ? 1 : -1));
  } }, { drag: { threshold: 70, axis: 'x', filterTaps: true } });

  async function pageText(pageNumber: number) {
    const cached = textCache.current.get(pageNumber);
    if (cached !== undefined) return cached;
    if (!document) return '';
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map(item => 'str' in item ? item.str : '').join(' ');
    textCache.current.set(pageNumber, text);
    return text;
  }

  async function findNext() {
    const needle = query.trim().toLocaleLowerCase('ar');
    if (!needle || !document || searching) return;
    setSearching(true);
    try {
      for (let step = 1; step <= total; step++) {
        const index = (current + step) % total;
        if ((await pageText(index + 1)).toLocaleLowerCase('ar').includes(needle)) {
          navigate(index);
          showToast.success(`تم العثور على العبارة في الصفحة ${index + 1}`);
          return;
        }
      }
      showToast.error('لم يتم العثور على العبارة في صفحات الفصل.');
    } catch { showToast.error('تعذر البحث داخل الملف حالياً.'); }
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
      if (navigator.share) await navigator.share({ title: `${novelTitle} — ${chapterTitle}`, text: `صفحة ${current + 1}`, url: url.toString() });
      else { await navigator.clipboard.writeText(url.toString()); showToast.success('تم نسخ رابط الصفحة'); }
    } catch (caught) { if (!(caught instanceof Error && caught.name === 'AbortError')) showToast.error('تعذرت مشاركة الصفحة.'); }
  }

  const bookmarkPages = useMemo<ReaderPage[]>(() => Array.from({ length: total }, (_, index) => ({ text: '', start: index, end: index + 1 })), [total]);

  return <section className={styles.reader} dir="rtl" aria-label="قارئ ملف الرواية">
    <header className={styles.header}><div><span className={styles.eyebrow}>{novelTitle}</span><h1>{chapterTitle}</h1><p className={pdfStyles.readerLead}>يعرض القارئ صفحات ملف الرواية الأصلي بترتيبها الكامل.</p></div><div className={styles.toolbar}><button aria-expanded={panel === 'settings'} onClick={() => setPanel(panel === 'settings' ? null : 'settings')}>إعدادات العرض</button><button aria-expanded={panel === 'bookmarks'} onClick={() => setPanel(panel === 'bookmarks' ? null : 'bookmarks')}>الفواصل</button><button onClick={() => void sharePage()} disabled={!total}>مشاركة الصفحة</button></div></header>
    <form className={styles.searchRow} onSubmit={event => { event.preventDefault(); void findNext(); }}><label htmlFor="pdf-search">بحث داخل الرواية</label><input id="pdf-search" type="search" maxLength={200} placeholder="ابحث عن كلمة أو عبارة…" value={query} onChange={event => setQuery(event.target.value)} /><button disabled={!query.trim() || searching || !document}>{searching ? 'جارٍ البحث…' : 'النتيجة التالية'}</button></form>
    {panel === 'settings' && <ReaderSettings settings={state.settings} onChange={state.setSettings} />}
    <div className={styles.layout}>
      <div className={styles.readingArea}>
        <div ref={container} className={styles.bookContainer} {...swipe()}>
          {error ? <div className={pdfStyles.readerMessage} role="alert">{error}</div> : !document || !state.ready ? <div className={styles.skeleton} role="status"><span /><span /><span /><span /><p>{loading || 'جارٍ استعادة موضع القراءة…'}</p></div> : <HTMLFlipBook key={`${document.fingerprints[0]}-${width}-${height}`} ref={flip} className={styles.flipBook} style={{}} width={width} height={height} size="fixed" minWidth={width} maxWidth={width} minHeight={height} maxHeight={height} startPage={total - 1 - current} drawShadow flippingTime={420} usePortrait startZIndex={1} autoSize={false} maxShadowOpacity={.24} showCover={false} mobileScrollSupport={false} clickEventForward useMouseEvents={false} swipeDistance={70} showPageCorners disableFlipByClick onFlip={(event: { data: number }) => state.setPosition(total - 1 - event.data)}>
            {Array.from({ length: total }, (_, index) => {
              const pageNumber = total - index;
              return <PdfPage key={pageNumber} document={document} pageNumber={pageNumber} active={pageNumber === current + 1} renderPage={Math.abs(pageNumber - (current + 1)) <= 2} width={width} height={height} brightness={state.settings.brightness} theme={state.settings.theme} />;
            })}
          </HTMLFlipBook>}
        </div>
        {total > 0 && <ReaderControls page={current} total={total} onChange={navigate} />}
        <p className={styles.hint}>السهم الأيسر للصفحة التالية، والأيمن للسابقة. يمكنك أيضاً السحب أفقياً.</p>
        <p className={styles.status} role="status">{state.status}{state.ready && state.userId && !state.cloudReady && <button onClick={state.retry}>إعادة المزامنة</button>}</p>
      </div>
      {panel === 'bookmarks' && <BookmarkPanel bookmarks={state.bookmarks} highlights={[]} pages={bookmarkPages} busy={busy} onJump={position => navigate(position, false)} onAdd={note => void perform(() => state.mutate(id => addBookmark({ chapterId, page: current + 1, position: current, note }, id), bookmark => { state.setBookmarks(items => [bookmark, ...items]); showToast.success('تمت إضافة الفاصل'); }))} onDelete={bookmarkId => void perform(() => state.mutate(id => deleteBookmark(bookmarkId, id), () => state.setBookmarks(items => items.filter(item => item.id !== bookmarkId))))} onDeleteHighlight={() => undefined} />}
    </div>
  </section>;
}
