import PageClient from './PageClient';
import { pageMetadata } from '@/lib/seo';
export function generateMetadata() { return pageMetadata("ملفي الشخصي","إدارة الملف الشخصي ونشاط القراءة.","/profile",true); }
export default function Page() { return <PageClient />; }
