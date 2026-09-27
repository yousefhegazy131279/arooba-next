import PageClient from './PageClient';
import { pageMetadata } from '@/lib/seo';
export function generateMetadata() { return pageMetadata("من نحن","تعرّف على عُروبة ورسالتها في تعريب القصص العالمية.","/about",false); }
export default function Page() { return <PageClient />; }
