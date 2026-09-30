import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';
import { getDirectInbox, getDirectMessagePage } from '@/app/community/social/actions';
import DirectMessages from '@/app/components/community/DirectMessages';

export const metadata: Metadata = { title: 'الرسائل الخاصة | مجتمع عُروبة', robots: { index: false, follow: false } };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ thread?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { thread } = await searchParams;
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(`/community/messages${thread ? `?thread=${encodeURIComponent(thread)}` : ''}`)}`);
  const inbox = await getDirectInbox();
  const selectedId = typeof thread === 'string' && /^[0-9a-f-]{36}$/i.test(thread) ? thread : null;
  let initialThread = null;
  if (selectedId) {
    try { initialThread = await getDirectMessagePage(selectedId); } catch { initialThread = null; }
  }
  return <DirectMessages userId={user.id} initialInbox={inbox} initialSelectedId={initialThread ? selectedId : null} initialThread={initialThread} />;
}
