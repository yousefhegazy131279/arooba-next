'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createPost,
  getCommunityRole,
  setCommunityRole,
} from '@/app/community/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '@/lib/supabaseClient';
import type { CommunityAttachment, CommunityRole } from '@/lib/community-types';
import { showToast } from '@/lib/toast';
import CommunityIcon from './CommunityIcon';
import FeedSkeleton from './FeedSkeleton';
import styles from './Community.module.css';

const formats: Record<string, { type: CommunityAttachment['type']; mime: string }> = {
  jpg: { type: 'image', mime: 'image/jpeg' },
  jpeg: { type: 'image', mime: 'image/jpeg' },
  png: { type: 'image', mime: 'image/png' },
  webp: { type: 'image', mime: 'image/webp' },
  gif: { type: 'image', mime: 'image/gif' },
  mp4: { type: 'video', mime: 'video/mp4' },
  webm: { type: 'video', mime: 'video/webm' },
  pdf: { type: 'pdf', mime: 'application/pdf' },
  docx: {
    type: 'docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
};

export default function CreatePostForm() {
  const { user, loading } = useAuthStore();
  const userId = user?.id;
  const [role, setRole] = useState<CommunityRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    void getCommunityRole()
      .then((value) => {
        if (live) setRole(value);
      })
      .catch((caught) => {
        if (live)
          setError(caught instanceof Error ? caught.message : 'تعذر تحميل نوع العضوية');
      })
      .finally(() => {
        if (live) setRoleLoading(false);
      });
    return () => {
      live = false;
    };
  }, [userId]);

  async function choose(value: CommunityRole) {
    setRoleLoading(true);
    setError('');
    try {
      const chosen = await setCommunityRole(value);
      setRole(chosen);
      if (user) useAuthStore.getState().setUser({ ...user, community_role: chosen });
      showToast.success(
        value === 'writer' ? 'أصبحت عضويتك كاتباً' : 'أصبحت عضويتك قارئاً'
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'تعذر تغيير نوع العضوية');
    } finally {
      setRoleLoading(false);
    }
  }

  function selectFiles(selected: FileList | File[] | null) {
    if (!selected) return;
    const next = Array.isArray(selected) ? selected : [...selected];
    if (next.length > 4) {
      setError('يمكنك إضافة أربعة ملفات كحد أقصى.');
      return;
    }
    for (const file of next) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const format = formats[ext];
      if (!format || (file.type && file.type !== format.mime)) {
        setError(`صيغة الملف ${file.name} غير مدعومة.`);
        return;
      }
      if (file.size === 0 || file.size > 40 * 1024 * 1024) {
        setError(`حجم ${file.name} يجب ألا يتجاوز ٤٠ ميغابايت.`);
        return;
      }
      if (role !== 'writer' && (format.type === 'pdf' || format.type === 'docx')) {
        setError('نشر الكتب متاح للكتّاب. غيّر نوع عضويتك إلى كاتب أولًا.');
        return;
      }
    }
    setFiles(next);
    setError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending || roleLoading) return;
    if (!role) {
      setError('اختر قارئاً أو كاتباً قبل النشر.');
      return;
    }
    if (!content.trim() || content.length > 2000) {
      setError('اكتب وصفاً من حرف واحد إلى ٢٠٠٠ حرف.');
      return;
    }
    if (!user) return;
    setPending(true);
    setError('');
    const uploaded: string[] = [];
    try {
      const attachments: CommunityAttachment[] = [];
      for (const file of files) {
        const chosenExt = file.name.split('.').pop()!.toLowerCase();
        const ext = chosenExt === 'jpeg' ? 'jpg' : chosenExt;
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('community-media')
          .upload(path, file, { contentType: formats[ext].mime, upsert: false });
        if (uploadError) throw uploadError;
        uploaded.push(path);
        attachments.push({ path, name: file.name.slice(0, 160), type: formats[ext].type });
      }
      await createPost(content.trim(), attachments);
      showToast.success('تم نشر مشاركتك في المجتمع');
      router.push('/community');
      router.refresh();
    } catch (caught) {
      if (uploaded.length)
        await supabase.storage.from('community-media').remove(uploaded);
      const message =
        caught instanceof Error ? caught.message : 'تعذر نشر المشاركة. حاول مرة أخرى.';
      setError(message);
      showToast.error(message);
      setPending(false);
    }
  }

  if (loading) return <FeedSkeleton count={1} />;

  if (!user)
    return (
      <div className={styles.guestCard}>
        <div className={styles.guestIcon}>
          <CommunityIcon name="users" size={32} />
        </div>
        <h2>انضم إلى المجتمع</h2>
        <p>سجّل دخولك لتشارك قراءاتك وكتاباتك.</p>
        <Link href="/login" className={styles.button}>
          تسجيل الدخول
        </Link>
      </div>
    );

  return (
    <form className={styles.createForm} onSubmit={submit} aria-busy={pending}>
      {/* ===== اختيار الدور ===== */}
      <div className={styles.roleSection}>
        <div className={styles.roleSectionHeader}>
          <strong>كيف تريد المشاركة؟</strong>
          <p className={styles.hint}>
            اختر نوع عضويتك قبل أول منشور. يمكنك تغييره لاحقاً.
          </p>
        </div>

        <div className={styles.roleOptions}>
          <button
            type="button"
            className={`${styles.roleCard} ${role === 'reader' ? styles.roleCardActive : ''}`}
            aria-pressed={role === 'reader'}
            disabled={pending || roleLoading}
            onClick={() => void choose('reader')}
          >
            <span className={styles.roleCardIcon}>
              <CommunityIcon name="book" size={22} />
            </span>
            <div className={styles.roleCardText}>
              <strong>قارئ</strong>
              <span>أشارك انطباعاتي وأقيّم أعمال الكتّاب</span>
            </div>
            {role === 'reader' && (
              <span className={styles.roleCardCheck}>
                <CommunityIcon name="check" size={16} />
              </span>
            )}
          </button>

          <button
            type="button"
            className={`${styles.roleCard} ${role === 'writer' ? styles.roleCardActive : ''}`}
            aria-pressed={role === 'writer'}
            disabled={pending || roleLoading}
            onClick={() => void choose('writer')}
          >
            <span className={styles.roleCardIcon}>
              <CommunityIcon name="edit" size={22} />
            </span>
            <div className={styles.roleCardText}>
              <strong>كاتب</strong>
              <span>أنشر نصوصي وملفات كتبي</span>
            </div>
            {role === 'writer' && (
              <span className={styles.roleCardCheck}>
                <CommunityIcon name="check" size={16} />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===== حقل المحتوى ===== */}
      <div className={styles.createField}>
        <label htmlFor="new-post" className={styles.createLabel}>
          {role === 'writer' ? 'قدّم عملك للقرّاء' : 'ما القصة التي بقيت معك؟'}
        </label>
        <textarea
          id="new-post"
          className={styles.createTextarea}
          rows={7}
          value={content}
          maxLength={2000}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            role === 'writer'
              ? 'عنوان العمل، فكرته، ولماذا تحب أن يقرأه الآخرون…'
              : 'شارك انطباعاً، اقتباساً أو سؤالاً يفتح حواراً…'
          }
          required
          disabled={pending || !role}
        />
      </div>

      {/* ===== رفع الملفات ===== */}
      <div className={styles.createField}>
        <label className={styles.createLabel}>
          أضف صوراً أو فيديوهات
          {role === 'writer' ? ' أو كتب PDF وWord' : ''}
        </label>

        <label
          className={`${styles.uploadArea} ${dragging ? styles.uploadAreaDragging : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            selectFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            accept={
              role === 'writer'
                ? '.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.pdf,.docx'
                : '.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm'
            }
            onChange={(event) => selectFiles(event.target.files)}
            disabled={pending || !role}
          />
          <span className={styles.uploadIcon}>
            <CommunityIcon name="paperclip" size={24} />
          </span>
          <div className={styles.uploadText}>
            <strong>اسحب الملفات هنا أو انقر للاختيار</strong>
            <span>حتى ٤ ملفات · ٤٠ ميغابايت للملف</span>
          </div>
        </label>

        {files.length > 0 && (
          <ul className={styles.fileList}>
            {files.map((file) => (
              <li key={file.name} className={styles.fileItem}>
                <span className={styles.fileItemIcon}>
                  <CommunityIcon name="file" size={14} />
                </span>
                <span className={styles.fileItemName}>{file.name}</span>
                <button
                  type="button"
                  className={styles.fileItemRemove}
                  onClick={() => setFiles((prev) => prev.filter((f) => f.name !== file.name))}
                  aria-label={`إزالة ${file.name}`}
                >
                  <CommunityIcon name="close" size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className={styles.hint}>
        انشر ما تملك حق مشاركته، واحترم اختلاف الآراء ونبّه إلى حرق الأحداث.
      </p>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {/* ===== زر الإرسال ===== */}
      <div className={styles.createFooter}>
        <span className={styles.counter}>
          {content.length.toLocaleString('ar')} / ٢٠٠٠ حرف
        </span>
        <button
          className={styles.createSubmit}
          disabled={pending || roleLoading || !role || !content.trim()}
        >
          {pending ? (
            <>
              <span className={styles.spinner} />
              <span>جارٍ النشر…</span>
            </>
          ) : (
            <>
              <CommunityIcon name="send" size={16} />
              <span>نشر المشاركة</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}