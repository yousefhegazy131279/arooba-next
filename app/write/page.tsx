import { pageMetadata } from '@/lib/seo';
import WriteHome from './WriteHome';

export function generateMetadata() { return pageMetadata('مساحة الكتابة', 'اكتب أعمالك في فصول واحفظها وشاركها مع القرّاء.', '/write', true); }
export default function WritePage() { return <WriteHome />; }
