import PageClient from './PageClient';
import { pageMetadata } from '@/lib/seo';

export function generateMetadata() {
  return pageMetadata(
    "من نحن",
    "تعرّف على عُروبة: منصة أدبية عربية متكاملة للقراءة والكتابة والتعريب والمجتمع.",
    "/about",
    false
  );
}

export default function Page() {
  return <PageClient />;
}