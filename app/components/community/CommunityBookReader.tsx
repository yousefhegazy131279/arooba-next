'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import RtlBook, { type RtlBookHandle } from '@/app/components/reader/RtlBook';
import { useBookDimensions } from '@/app/components/reader/useBookDimensions';
import type { CommunityAttachment } from '@/lib/community-types';
import CommunityIcon from './CommunityIcon';
import styles from './Community.module.css';

function textPages(text: string, maxChars: number) {
  const paragraphs = text
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const pages: string[] = [];
  let page = '';
  for (const paragraph of paragraphs) {
    for (const word of paragraph.split(/\s+/)) {
      if (page.length + word.length > maxChars && page) {
        pages.push(page.trim());
        page = '';
      }
      page += `${word} `;
    }
    page += '\n\n';
  }
  if (page.trim()) pages.push(page.trim());
  return pages.length ? pages : ['هذا الملف لا يحتوي على نص قابل للعرض.'];
}

function PdfLeaf({
  pdf,
  number,
  width,
  height,
}: {
  pdf: PDFDocumentProxy;
  number: number;
  width: number;
  height: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    void pdf
      .getPage(number)
      .then(async (page) => {
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: Math.min((width - 20) / base.width, (height - 28) / base.height),
        });
        const surface = canvas.current;
        if (!surface || !live) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        surface.width = Math.floor(viewport.width * dpr);
        surface.height = Math.floor(viewport.height * dpr);
        surface.style.width = `${viewport.width}px`;
        surface.style.height = `${viewport.height}px`;
        const context = surface.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        await page.render({
          canvas: surface,
          canvasContext: context,
          viewport,
          transform: [dpr, 0, 0, dpr, 0, 0],
        }).promise;
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [pdf, number, width, height]);

  return (
    <div className={styles.bookLeaf}>
      {error ? (
        <p role="alert">تعذر عرض هذه الصفحة.</p>
      ) : (
        <canvas ref={canvas} aria-label={`صفحة ${number}`} />
      )}
      <span className={styles.bookLeafNumber}>{number}</span>
    </div>
  );
}

export default function CommunityBookReader({
  attachment,
  url,
}: {
  attachment: CommunityAttachment;
  url: string;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [text, setText] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const flip = useRef<RtlBookHandle>(null);
  const { container, width, height, single } = useBookDimensions(0.707);
  const pages = useMemo(
    () =>
      attachment.type === 'docx'
        ? textPages(text, Math.max(380, Math.round((width * height) / 290)))
        : [],
    [text, width, height, attachment.type]
  );
  const total = pdf?.numPages || (attachment.type === 'docx' && text ? pages.length : 0);

  useEffect(() => {
    let live = true;
    const resource: { current: PDFDocumentProxy | null } = { current: null };
    if (attachment.type === 'pdf') {
      void import('pdfjs-dist')
        .then(async (library) => {
          library.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
          const document = await library.getDocument({ url, disableFontFace: true }).promise;
          resource.current = document;
          if (live) setPdf(document);
        })
        .catch(() => {
          if (live) setError('تعذر فتح ملف PDF.');
        });
    } else {
      void Promise.all([
        fetch(url).then((response) => {
          if (!response.ok) throw new Error('Download failed');
          return response.arrayBuffer();
        }),
        import('mammoth'),
      ])
        .then(async ([arrayBuffer, mammoth]) => {
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (live) setText(result.value);
        })
        .catch(() => {
          if (live) setError('تعذر قراءة ملف Word. تأكد أنه بصيغة DOCX سليمة.');
        });
    }
    return () => {
      live = false;
      if (resource.current) void resource.current.cleanup();
    };
  }, [attachment.type, url]);

  return (
    <section className={styles.bookReader} dir="rtl" aria-label={`قراءة ${attachment.name}`}>
      {/* رأس القارئ */}
      <header className={styles.bookReaderHeader}>
        <div className={styles.bookReaderIcon}>
          <CommunityIcon name="book" size={22} />
        </div>
        <div className={styles.bookReaderText}>
          <span className={styles.bookReaderEyebrow}>مكتبة المجتمع</span>
          <h1>{attachment.name}</h1>
          <p>
            {attachment.type === 'pdf' ? 'ملف PDF' : 'مستند Word'} · اقلب الصفحات
            من اليمين إلى اليسار
          </p>
        </div>
        <a
          className={styles.bookReaderDownload}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <CommunityIcon name="eye" size={16} />
          <span>فتح الملف الأصلي</span>
        </a>
      </header>

      {/* الأخطاء والتحميل */}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {!error && !total && (
        <div className={styles.bookReaderLoading} role="status">
          <div className={styles.bookReaderSpinner} />
          <p>جارٍ تجهيز صفحات الكتاب…</p>
        </div>
      )}

      {/* الكتاب */}
      <div ref={container} className={styles.bookMount}>
        {total > 0 && (
          <RtlBook
            ref={flip}
            width={width}
            height={height}
            single={single}
            page={page}
            total={total}
            onChange={setPage}
            renderPage={(index) =>
              pdf ? (
                <PdfLeaf
                  key={`pdf-${index}-${width}`}
                  pdf={pdf}
                  number={index + 1}
                  width={width}
                  height={height}
                />
              ) : (
                <div key={`doc-${index}`} className={styles.bookLeaf}>
                  <p>{pages[index]}</p>
                  <span className={styles.bookLeafNumber}>{index + 1}</span>
                </div>
              )
            }
          />
        )}
      </div>

      {/* التنقل */}
      {total > 0 && (
        <nav className={styles.bookReaderPager} aria-label="صفحات الكتاب">
          <button
            type="button"
            className={styles.bookReaderNavBtn}
            disabled={page === 0}
            onClick={() => flip.current?.goTo(Math.max(0, page - (single ? 1 : 2)))}
          >
            <CommunityIcon name="back" size={16} />
            <span>السابقة</span>
          </button>

          <div className={styles.bookReaderProgress}>
            <span className={styles.bookReaderPageNum}>
              {page + 1} / {total}
            </span>
            <div className={styles.bookReaderProgressBar}>
              <span
                style={{
                  width: `${((page + 1) / total) * 100}%`,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.bookReaderNavBtn}
            disabled={page >= total - 1}
            onClick={() => flip.current?.goTo(Math.min(total - 1, page + (single ? 1 : 2)))}
          >
            <span>التالية</span>
            <CommunityIcon name="back" size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </nav>
      )}
    </section>
  );
}