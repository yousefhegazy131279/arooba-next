'use client';
import styles from './reader.module.css';

export default function ReaderControls({ page, total, onChange }: { page: number; total: number; onChange: (value: number) => void }) {
  return <nav className={styles.controls} aria-label="تنقل صفحات الفصل">
    <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="الصفحة السابقة">→ السابق</button>
    <label className={styles.progress}><span aria-live="polite">صفحة {page + 1} من {total}</span><input aria-label="انتقل إلى صفحة" type="range" min="0" max={Math.max(0, total - 1)} value={page} onChange={event => onChange(Number(event.target.value))} /></label>
    <button type="button" disabled={page >= total - 1} onClick={() => onChange(page + 1)} aria-label="الصفحة التالية">التالي ←</button>
  </nav>;
}
