import PageClient from './PageClient';
import { pageMetadata } from '@/lib/seo';

export function generateMetadata() {
  return pageMetadata(
    'تواصل معنا',
    'تواصل مع فريق عُروبة. أرسل اقتراحك، استفسارك، أو تعاونك معنا.',
    '/contact',
    true
  );
}

export default function Page() {
  return <PageClient />;
}