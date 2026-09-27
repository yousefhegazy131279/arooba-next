import PageClient from './PageClient';
import { pageMetadata } from '@/lib/seo';
export function generateMetadata() { return pageMetadata("المفضلات","رواياتك المفضلة في مكان واحد.","/profile/favorites",true); }
export default function Page() { return <PageClient />; }
