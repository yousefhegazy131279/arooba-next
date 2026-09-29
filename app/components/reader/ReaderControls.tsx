'use client';
import styles from './reader.module.css';

export default function ReaderControls({ page, total, onChange, endPage = null, step = 1 }: { page: number; total: number; onChange: (value: number) => void; endPage?: number | null; step?: number }) {
  return <nav className={styles.controls} aria-label="تنقل صفحات الفصل">
    <button type="button" disabled={page === 0} onClick={() => onChange(page - step)} aria-label="الصفحة السابقة">→ السابق</button>
    <label className={styles.progress}><span aria-live="polite">{endPage === null ? `صفحة ${page + 1}` : `الصفحتان ${page + 1} و${endPage + 1}`} من {total}</span><input aria-label="انتقل إلى صفحة" type="range" min="0" max={Math.max(0, total - 1)} value={page} onChange={event => onChange(Number(event.target.value))} /></label>
    <button type="button" disabled={page + step >= total} onClick={() => onChange(page + step)} aria-label="الصفحة التالية">التالي ←</button>
  </nav>;
}
