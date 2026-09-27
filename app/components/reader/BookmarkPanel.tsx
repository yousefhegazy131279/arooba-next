'use client';
import { useState } from 'react';
import { pageForPosition, type Bookmark, type ReaderPage, type Highlight } from '@/lib/reader';
import styles from './reader.module.css';

type Props = { bookmarks: Bookmark[]; highlights: Highlight[]; pages: ReaderPage[]; busy: boolean; onAdd: (note: string) => void; onJump: (position: number) => void; onDelete: (id: string) => void; onDeleteHighlight: (id: string) => void };
export default function BookmarkPanel({ bookmarks, highlights, pages, busy, onAdd, onJump, onDelete, onDeleteHighlight }: Props) {
  const [note, setNote] = useState('');
  return <aside className={styles.panel} aria-label="الفواصل والتظليلات">
    <h2>الفواصل والملاحظات</h2>
    <form onSubmit={event => { event.preventDefault(); onAdd(note); }}>
      <label htmlFor="bookmark-note">ملاحظة للصفحة الحالية (اختياري)</label>
      <textarea id="bookmark-note" value={note} maxLength={500} rows={3} onChange={event => setNote(event.target.value)} placeholder="فكرة تستحق العودة إليها…" />
      <button disabled={busy} type="submit">إضافة فاصل للصفحة الحالية</button>
    </form>
    {bookmarks.length === 0 ? <p className={styles.muted}>لم تضف فواصل لهذا الفصل بعد.</p> : <ul className={styles.savedList}>{bookmarks.map(bookmark => <li key={bookmark.id}><button className={styles.savedJump} onClick={() => onJump(bookmark.position)}>صفحة {pageForPosition(pages, bookmark.position) + 1}<span>{bookmark.note || 'فاصل مرجعي'}</span></button><button disabled={busy} aria-label={`حذف الفاصل في الصفحة ${pageForPosition(pages, bookmark.position) + 1}`} onClick={() => onDelete(bookmark.id)}>حذف</button></li>)}</ul>}
    <h2>النصوص المظللة</h2>
    <p className={styles.muted}>حدد نصاً في الصفحة ثم اختر لوناً لحفظه.</p>
    {highlights.length === 0 ? <p className={styles.muted}>لا توجد تظليلات محفوظة.</p> : <ul className={styles.savedList}>{highlights.map(highlight => <li key={highlight.id}><button className={styles.savedJump} onClick={() => onJump(highlight.start_offset)}><mark data-color={highlight.color}>{highlight.text}</mark></button><button disabled={busy} aria-label="حذف التظليل" onClick={() => onDeleteHighlight(highlight.id)}>حذف</button></li>)}</ul>}
  </aside>;
}
