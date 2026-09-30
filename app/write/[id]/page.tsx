import { pageMetadata } from '@/lib/seo';
import WriterEditor from './WriterEditor';

export function generateMetadata() { return pageMetadata('محرر الكتابة', 'اكتب فصول عملك الأدبي واحفظه وشاركه.', '/write', true); }
export default async function WriterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WriterEditor workId={id} />;
}
