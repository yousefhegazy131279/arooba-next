import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost } from '@/app/community/actions';
import CommunityBookReader from '@/app/components/community/CommunityBookReader';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import styles from './read.module.css';

export default async function CommunityReadPage({
  params,
}: {
  params: Promise<{ id: string; index: string }>;
}) {
  const { id, index } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^\d+$/.test(index)) notFound();

  const post = await getPost(id);
  const attachment = post?.attachments[Number(index)];
  if (!post || !attachment || !['pdf', 'docx'].includes(attachment.type)) notFound();

  const { data } = supabaseAdmin.storage
    .from('community-media')
    .getPublicUrl(attachment.path);

  return (
    <div className={styles.page}>
      {/* زر العودة */}
      <Link href={`/community/post/${id}`} className={styles.backLink}>
        <CommunityIcon name="back" size={16} />
        <span>العودة إلى العمل والتعليقات</span>
      </Link>

      {/* رأس الصفحة */}
      <header className={styles.head}>
        <div className={styles.headIcon}>
          <CommunityIcon name="book" size={22} />
        </div>
        <div className={styles.headText}>
          <span className={styles.eyebrow}>قارئ الكتب</span>
          <h1>{attachment.name || 'العمل المرفق'}</h1>
          <p>
            {attachment.type === 'pdf' ? 'ملف PDF' : 'مستند Word'} · يُعرض بصفحاته
            الأصلية
          </p>
        </div>
      </header>

      {/* القارئ */}
      <div className={styles.readerWrap}>
        <CommunityBookReader attachment={attachment} url={data.publicUrl} />
      </div>
    </div>
  );
}