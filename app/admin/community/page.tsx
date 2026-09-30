import { requireAdmin } from '@/lib/actionAuth';
import { pageMetadata } from '@/lib/seo';
import CommunityAdminClient from './CommunityAdminClient';
import { getAdminCommunityOverview, getAdminCommunityPosts } from './actions';

export function generateMetadata() {
  return pageMetadata('إدارة المجتمع', 'إدارة منشورات ونشاط مجتمع عُروبة.', '/admin/community', true);
}

export default async function AdminCommunityPage() {
  await requireAdmin();
  const [overview, page] = await Promise.all([
    getAdminCommunityOverview(),
    getAdminCommunityPosts({ page: 0, role: 'all', visibility: 'all', search: '' }),
  ]);
  return <CommunityAdminClient initialOverview={overview} initialPage={page} />;
}
