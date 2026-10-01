import { pageMetadata } from "@/lib/seo";
import HeroSection from "@/app/components/HeroSection";
import PillarsSection from "@/app/components/home/PillarsSection";
import StorySection from "@/app/components/StorySection";
import SuggestionsSection from "@/app/components/SuggestionsSection";

export function generateMetadata() {
  return pageMetadata(
    "القصص العالمية بالعربية",
    "منصة عُروبة للروايات والقصص العالمية المعرّبة. اقرأ، اكتب، عرّب، وشارك.",
    "/",
    false
  );
}

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
      <HeroSection />
      <PillarsSection />
      <StorySection />
      <SuggestionsSection />
    </div>
  );
}