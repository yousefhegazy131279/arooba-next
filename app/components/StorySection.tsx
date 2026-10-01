"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./StorySection.module.css";
import { supabase } from "@/lib/supabaseClient";

interface Story {
  id: string;
  title: string;
  description: string;
  cover: string;
  category?: string;
  chapters_count?: number;
  avg_rating?: number;
  total_ratings?: number;
}

const StorySection = () => {
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState(false);

  const whyItems = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      title: "قصص خالدة",
      description: "روايات صعب أن تنسى",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2 L22 2 L20 8 L4 8 L2 2 Z" />
          <path d="M12 8 L12 16" />
          <path d="M8 16 L16 16" />
          <path d="M6 22 L10 22 L10 16 L6 16 L6 22 Z" />
          <path d="M14 22 L18 22 L18 16 L14 16 L14 22 Z" />
        </svg>
      ),
      title: "تعريب كما قال الكتاب",
      description: "نحاول أن يكون التعريب على أعلى مستوى ليحظى القارئ بأفضل تجربة ممكنة",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
      title: "نستمع للجمهور",
      description: "رأيك هو أكثر ما يهمنا لذا لا تكن خجولاً واقترح ما تشاء!",
    },
  ];

  const getCoverUrl = (coverPath: string): string => {
    if (!coverPath) return "";
    if (coverPath.startsWith("http") || coverPath.startsWith("/")) return coverPath;
    return `/covers/${coverPath}`;
  };

  const fetchStory = async () => {
    setPending(true);
    setError(false);
    try {
      const { data: novel, error: novelError } = await supabase
        .from("novels")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (novelError) throw novelError;
      if (!novel) {
        setError(true);
        return;
      }

      const { data: ratings } = await supabase
        .from("ratings")
        .select("rating")
        .eq("novel_id", novel.id);

      let avgRating = 0;
      let totalRatings = 0;
      if (ratings && ratings.length > 0) {
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        avgRating = sum / ratings.length;
        totalRatings = ratings.length;
      }

      const { count: chaptersCount } = await supabase
        .from("chapters")
        .select("*", { count: "exact", head: true })
        .eq("novel_id", novel.id);

      setStory({
        id: novel.id,
        title: novel.title,
        description: novel.description || "",
        cover: novel.cover,
        category: novel.category,
        chapters_count: chaptersCount || 0,
        avg_rating: avgRating,
        total_ratings: totalRatings,
      });
    } catch (err) {
      console.error("خطأ في جلب القصة:", err);
      setError(true);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    fetchStory();
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: false,
      mirror: true,
      anchorPlacement: "top-bottom",
    });
    const handleResize = () => AOS.refresh();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const goToStory = () => {
    if (story) router.push(`/stories/${story.id}`);
  };

  return (
    <section className={styles.storySection}>
      <div className={styles.heroBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.container}>
        {/* ===== الترويسة ===== */}
        <div className={styles.sectionHeader} data-aos="fade-up" data-aos-duration="1000">
          <span className={styles.sectionBadge}>أعمالنا</span>
          <h2 className={styles.sectionTitle}>
            <span className={styles.titleWord}>استمتع بالقصص العالمية</span>
            <span className={`${styles.titleWord} ${styles.gold}`}>بلغة الضاد</span>
          </h2>
          <div className={styles.titleDecoration}>
            <span className={styles.decorationLine}></span>
            <span className={styles.decorationStar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span className={styles.decorationLine}></span>
          </div>
        </div>

        {/* ===== التحميل ===== */}
        {pending && (
          <div className={styles.loadingState}>
            <div className={styles.loader}></div>
            <p>جاري تحميل القصة المميزة...</p>
          </div>
        )}

        {/* ===== الخطأ ===== */}
        {error && !pending && (
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <p>عذراً، حدث خطأ في تحميل القصة.</p>
          </div>
        )}

        {/* ===== البطاقة ===== */}
        {!pending && !error && story && (
          <div
            className={styles.storyCard}
            data-aos="fade-up"
            data-aos-duration="1200"
            data-aos-delay="200"
          >
            <div className={styles.cardWrapper} onClick={goToStory}>
              {/* زخرفة خلفية */}
              <div className={styles.cardGlow}></div>

              {/* الصورة */}
              <div className={styles.imageContainer}>
                <div className={styles.imageFrame}></div>
                <img src={getCoverUrl(story.cover)} alt={story.title} />
                <div className={styles.imageOverlay}></div>
                <div className={styles.storyBadge}>
                  <span className={styles.badgeIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </span>
                  <span>{story.category || "الأكثر قراءة"}</span>
                </div>
              </div>

              {/* المحتوى */}
              <div className={styles.cardContent}>
                <span className={styles.eyebrow}>قصة الأسبوع</span>
                <h3 className={styles.storyTitle}>{story.title}</h3>
                <p className={styles.storyDescription}>{story.description}</p>

                {/* الإحصائيات */}
                <div className={styles.storyStats}>
                  <div className={styles.statBox}>
                    <span className={styles.statIconWrap}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    </span>
                    <div className={styles.statInfo}>
                      <span className={styles.statNumber}>{story.chapters_count}</span>
                      <span className={styles.statLabel}>فصل</span>
                    </div>
                  </div>

                  <div className={styles.statBox}>
                    <span className={styles.statIconWrap}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </span>
                    <div className={styles.statInfo}>
                      <span className={styles.statNumber}>
                        {story.avg_rating ? story.avg_rating.toFixed(1) : "0"}
                      </span>
                      <span className={styles.statLabel}>
                        {story.total_ratings} تقييم
                      </span>
                    </div>
                  </div>
                </div>

                <button className={styles.readButton}>
                  <span>اقرأ الآن</span>
                  <span className={styles.buttonArrow}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== بطاقات Why ===== */}
        <div className={styles.whySection}>
          <div className={styles.whyGrid}>
            {whyItems.map((item, index) => (
              <div
                key={index}
                className={styles.whyCard}
                data-aos={index % 2 === 0 ? "fade-left" : "fade-right"}
                data-aos-delay={500 + index * 100}
              >
                <div className={styles.whyIcon}>{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;