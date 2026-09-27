import { pageMetadata } from '@/lib/seo';
export function generateMetadata() { return pageMetadata("القصص العالمية بالعربية","منصة عُروبة للروايات والقصص العالمية المعرّبة.","/",false); }
import HeroSection from "@/app/components/HeroSection";
import StorySection from "@/app/components/StorySection";
import SuggestionsSection from '@/app/components/SuggestionsSection';
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
         <HeroSection />
         <StorySection />
         <SuggestionsSection />
    </div>
  );
}