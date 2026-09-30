'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { getMemberDirectory } from '@/app/community/social/actions';
import type { SocialMember } from '@/lib/social-types';
import Avatar from './Avatar';
import styles from './Social.module.css';

type Role = 'all' | 'reader' | 'writer';
export default function MemberDirectory({ initial }: { initial: { members: SocialMember[]; total: number } }) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role>('all');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(initial);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        try { setResult(await getMemberDirectory({ search, role, page })); setError(''); }
        catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذّر تحميل الأعضاء'); }
      });
    }, search ? 280 : 0);
    return () => window.clearTimeout(timer);
  }, [search, role, page]);
  return <section className={styles.directory} aria-label="أعضاء المجتمع">
    <div className={styles.directoryTools}>
      <label className={styles.searchLabel}>ابحث عن عضو<input value={search} maxLength={50} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="الاسم أو اسم المستخدم" /></label>
      <div className={styles.tabs} aria-label="نوع العضوية">{([['all', 'الجميع'], ['writer', 'الكتّاب'], ['reader', 'القرّاء']] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={role === key} onClick={() => { setRole(key); setPage(0); }}>{label}</button>)}</div>
    </div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <p className={styles.subtle} aria-live="polite">{pending ? 'جارٍ البحث…' : `${result.total} عضو`}</p>
    {result.members.length ? <div className={styles.memberGrid}>{result.members.map(member => <article className={styles.memberCard} key={member.id}>
      <Link className={styles.memberAvatar} href={`/community/user/${encodeURIComponent(member.username)}`} aria-label={`زيارة ملف ${member.full_name || member.username}`}><Avatar src={member.avatar_url} name={member.full_name || member.username} size={64} /></Link>
      <div><span className={styles.role}>{member.community_role === 'writer' ? 'كاتب' : 'قارئ'}</span><h2><Link href={`/community/user/${encodeURIComponent(member.username)}`}>{member.full_name || member.username}</Link></h2><span className={styles.handle}>@{member.username}</span><p>{member.bio || (member.community_role === 'writer' ? 'يشارك أعماله مع مجتمع عُروبة.' : 'يستكشف الأعمال ويشارك رأيه.')}</p></div>
      <Link className={styles.outlineButton} href={`/community/user/${encodeURIComponent(member.username)}`}>زيارة الملف ←</Link>
    </article>)}</div> : !pending && <div className={styles.empty}>لا يوجد أعضاء مطابقون للبحث.</div>}
    {result.total > 18 && <nav className={styles.pagination} aria-label="صفحات الأعضاء"><button disabled={pending || page === 0} onClick={() => setPage(page - 1)}>السابق</button><span>صفحة {page + 1} من {Math.ceil(result.total / 18)}</span><button disabled={pending || (page + 1) * 18 >= result.total} onClick={() => setPage(page + 1)}>التالي</button></nav>}
  </section>;
}
