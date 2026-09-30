import PageClient from './PageClient';
import { pageMetadata } from '@/lib/seo';
import { requireAdmin } from '@/lib/actionAuth';
export function generateMetadata() { return pageMetadata("لوحة الإدارة","إدارة منصة عُروبة.","/admin",true); }
const tabs = ['stats', 'suggestions', 'messages', 'novels', 'users'] as const;
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const requested = (await searchParams).tab;
  const initialTab = tabs.find(tab => tab === requested) || 'stats';
  return <PageClient initialTab={initialTab} />;
}
