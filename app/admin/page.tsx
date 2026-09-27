import PageClient from './PageClient';
import { pageMetadata } from '@/lib/seo';
import { requireAdmin } from '@/lib/actionAuth';
export function generateMetadata() { return pageMetadata("لوحة الإدارة","إدارة منصة عُروبة.","/admin",true); }
export default async function Page() { await requireAdmin(); return <PageClient />; }
