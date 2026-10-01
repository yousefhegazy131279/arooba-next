'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { getMemberDirectory } from '@/app/community/social/actions';
import type { SocialMember } from '@/lib/social-types';
import Avatar from './Avatar';
import CommunityIcon from './CommunityIcon';
import styles from './MemberDirectory.module.css';

type Role = 'all' | 'reader' | 'writer';

const roleTabs: { id: Role; label: string; icon: 'users' | 'edit' | 'book' }[] = [
  { id: 'all', label: 'الجميع', icon: 'users' },
  { id: 'writer', label: 'الكتّاب', icon: 'edit' },
  { id: 'reader', label: 'القرّاء', icon: 'book' },
];

export default function MemberDirectory({
  initial,
}: {
  initial: { members: SocialMember[]; total: number };
}) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role>('all');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(initial);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        startTransition(async () => {
          try {
            setResult(await getMemberDirectory({ search, role, page }));
            setError('');
          } catch (issue) {
            setError(
              issue instanceof Error ? issue.message : 'تعذّر تحميل الأعضاء'
            );
          }
        });
      },
      search ? 280 : 0
    );
    return () => window.clearTimeout(timer);
  }, [search, role, page]);

  const totalPages = Math.ceil(result.total / 18);

  return (
    <section className={styles.directory} aria-label="أعضاء المجتمع">
      {/* ===== أدوات البحث والتصفية ===== */}
      <div className={styles.tools}>
        {/* البحث */}
        <label className={styles.searchBox}>
          <span className={styles.searchIcon}>
            <CommunityIcon name="search" size={18} />
          </span>
          <input
            value={search}
            maxLength={50}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="ابحث بالاسم أو اسم المستخدم…"
            aria-label="البحث عن عضو"
          />
          {search && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => {
                setSearch('');
                setPage(0);
              }}
              aria-label="مسح البحث"
            >
              <CommunityIcon name="close" size={14} />
            </button>
          )}
        </label>

        {/* الفلاتر */}
        <div className={styles.tabs} role="group" aria-label="نوع العضوية">
          {roleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={role === tab.id}
              onClick={() => {
                setRole(tab.id);
                setPage(0);
              }}
              className={`${styles.tab} ${role === tab.id ? styles.tabActive : ''}`}
            >
              <CommunityIcon name={tab.icon} size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== عدّاد النتائج ===== */}
      <div className={styles.results}>
        <span className={styles.resultsCount} aria-live="polite">
          {pending ? (
            <>
              <span className={styles.resultsSpinner} />
              <span>جارٍ البحث…</span>
            </>
          ) : (
            <>
              <strong>{result.total.toLocaleString('ar')}</strong>
              <span>عضو</span>
            </>
          )}
        </span>

        {error && (
          <span className={styles.errorText} role="alert">
            {error}
          </span>
        )}
      </div>

      {/* ===== الشبكة ===== */}
      {result.members.length > 0 ? (
        <div className={styles.grid}>
          {result.members.map((member, index) => (
            <article
              key={member.id}
              className={styles.card}
              style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
            >
              {/* الصورة */}
              <Link
                className={styles.avatarLink}
                href={`/community/user/${encodeURIComponent(member.username)}`}
                aria-label={`زيارة ملف ${member.full_name || member.username}`}
              >
                <Avatar
                  src={member.avatar_url}
                  name={member.full_name || member.username}
                  size={72}
                  ring
                />
                <span
                  className={`${styles.roleBadge} ${
                    member.community_role === 'writer'
                      ? styles.roleBadgeWriter
                      : styles.roleBadgeReader
                  }`}
                >
                  {member.community_role === 'writer' ? 'كاتب' : 'قارئ'}
                </span>
              </Link>

              {/* المعلومات */}
              <div className={styles.body}>
                <h2 className={styles.name}>
                  <Link
                    href={`/community/user/${encodeURIComponent(member.username)}`}
                  >
                    {member.full_name || member.username}
                  </Link>
                </h2>
                <span className={styles.handle}>@{member.username}</span>

                <p className={styles.bio}>
                  {member.bio ||
                    (member.community_role === 'writer'
                      ? 'يشارك أعماله مع مجتمع عُروبة.'
                      : 'يستكشف الأعمال ويشارك رأيه.')}
                </p>
              </div>

              {/* الزر */}
              <Link
                className={styles.visitBtn}
                href={`/community/user/${encodeURIComponent(member.username)}`}
              >
                <span>زيارة الملف</span>
                <CommunityIcon
                  name="back"
                  size={14}
                  style={{ transform: 'rotate(180deg)' }}
                />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        !pending && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <CommunityIcon name="users" size={32} />
            </div>
            <h3>لا يوجد أعضاء مطابقون</h3>
            <p>جرّب كلمة بحث أخرى أو غيّر الفلتر.</p>
          </div>
        )
      )}

      {/* ===== Pagination ===== */}
      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="صفحات الأعضاء">
          <button
            className={styles.pageBtn}
            disabled={pending || page === 0}
            onClick={() => setPage(page - 1)}
            aria-label="الصفحة السابقة"
          >
            <CommunityIcon
              name="back"
              size={16}
              style={{ transform: 'rotate(180deg)' }}
            />
            <span>السابق</span>
          </button>

          <span className={styles.pageInfo} aria-live="polite">
            صفحة <strong>{page + 1}</strong> من <strong>{totalPages}</strong>
          </span>

          <button
            className={styles.pageBtn}
            disabled={pending || page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
            aria-label="الصفحة التالية"
          >
            <span>التالي</span>
            <CommunityIcon name="back" size={16} />
          </button>
        </nav>
      )}
    </section>
  );
}