import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost } from '@/app/community/actions';
import CommunityBookReader from '@/app/components/community/CommunityBookReader';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import styles from '@/app/components/community/Community.module.css';

export default async function CommunityReadPage({ params }: { params: Promise<{ id: string; index: string }> }) {
  const { id, index } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^\d+$/.test(index)) notFound();
  const post = await getPost(id);
  const attachment = post?.attachments[Number(index)];
  if (!post || !attachment || !['pdf', 'docx'].includes(attachment.type)) notFound();
  const { data } = supabaseAdmin.storage.from('community-media').getPublicUrl(attachment.path);
  return <div className={styles.readPage}><Link className={styles.textLink} href={`/community/post/${id}`}>← العودة إلى العمل والتعليقات</Link><CommunityBookReader attachment={attachment} url={data.publicUrl} /></div>;
}
