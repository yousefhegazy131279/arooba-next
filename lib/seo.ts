import type { Metadata } from 'next';
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://arooba-hgz.vercel.app').replace(/\/$/, '');
export function pageMetadata(title: string, description: string, path?: string, privatePage = false): Metadata {
  return {
    title, description,
    ...(path ? { alternates: { canonical: siteUrl + path } } : {}),
    openGraph: { title: title + ' | عُروبة', description, locale: 'ar_AR', type: 'website', siteName: 'عُروبة' },
    ...(privatePage ? { robots: { index: false, follow: false } } : {}),
  };
}

