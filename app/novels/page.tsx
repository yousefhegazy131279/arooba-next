import PageClient from './PageClient';
import { pageMetadata } from '@/lib/seo';
export function generateMetadata() { return pageMetadata("مكتبة الروايات","اكتشف القصص والروايات العالمية المعرّبة على عُروبة.","/novels",false); }
export default function Page() { return <PageClient />; }
