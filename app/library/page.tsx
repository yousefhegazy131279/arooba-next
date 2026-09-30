import { pageMetadata } from '@/lib/seo';
import LibraryClient from './LibraryClient';

export function generateMetadata() { return pageMetadata('مكتبتي', 'رواياتك المحفوظة ومسوداتك وموضع قراءتك في مكان واحد.', '/library', true); }
export default function LibraryPage() { return <LibraryClient />; }
