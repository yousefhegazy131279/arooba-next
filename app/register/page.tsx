import PageClient from './PageClient';
import { pageMetadata } from '@/lib/seo';
export function generateMetadata() { return pageMetadata("إنشاء حساب","انضم إلى مجتمع عُروبة.","/register",true); }
export default function Page() { return <PageClient />; }
