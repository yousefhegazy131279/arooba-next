import PageClient from './PageClient';
import { Suspense } from 'react';
import { pageMetadata } from '@/lib/seo';
export function generateMetadata() { return pageMetadata("إنشاء حساب","انضم إلى مجتمع عُروبة.","/register",true); }
export default function Page() { return <Suspense fallback={<div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>}><PageClient /></Suspense>; }
