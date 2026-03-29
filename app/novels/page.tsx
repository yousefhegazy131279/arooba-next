'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./Novels.module.css";
import { supabase } from "@/lib/supabaseClient";

interface Novel {
  id: string;
  title: string;
  author?: string;
  cover: string;
  category?: string;
  chapters_count?: number;
  avg_rating?: number;
  total_ratings?: number;
  created_at?: string;
  isNew?: boolean;
}

const categories = [
  { name: "كلاسيكيات", icon: "🏛️" },
  { name: "مغامرات", icon: "⚔️" },
  { name: "خيال علمي", icon: "🚀" },
  { name: "دراما", icon: "🎭" },
  { name: "تاريخية", icon: "⏳" },
  { name: "رومانسية", icon: "❤️" },
  { name: "غموض", icon: "🔍" },
];

const getCoverUrl = (coverPath: string): string => {
  if (!coverPath) return '';
  if (coverPath.startsWith('http')) return coverPath;
  if (coverPath.startsWith('/covers/')) return coverPath;
  return `/covers/${coverPath}`;
};

export default function NovelsPage() {
  const router = useRouter();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // جلب الروايات مع التقييمات
  const fetchNovels = async () => {
    setLoading(true);
    setError(false);
    try {
      // 1. جلب الروايات
      const { data: novelsData, error: novelsError } = await supabase
        .from('novels')
        .select('*')
        .order('created_at', { ascending: false });

      if (novelsError) throw novelsError;
      if (!novelsData) throw new Error('No data');

      // 2. جلب التقييمات لكل رواية
      const novelIds = novelsData.map(n => n.id);
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('novel_id, rating')
        .in('novel_id', novelIds);

      if (ratingsError) throw ratingsError;

      // 3. حساب المتوسط وعدد التقييمات لكل رواية
      const ratingsMap: Record<string, { sum: number; count: number }> = {};
      if (ratingsData) {
        ratingsData.forEach(r => {
          if (!ratingsMap[r.novel_id]) {
            ratingsMap[r.novel_id] = { sum: 0, count: 0 };
          }
          ratingsMap[r.novel_id].sum += r.rating;
          ratingsMap[r.novel_id].count += 1;
        });
      }

      // 4. دمج البيانات
      const processed: Novel[] = novelsData.map((novel: any) => {
        const stats = ratingsMap[novel.id];
        const avg = stats ? stats.sum / stats.count : 0;
        return {
          ...novel,
          avg_rating: avg,
          total_ratings: stats?.count || 0,
          chapters_count: novel.chapters_count || 0,
          isNew: novel.created_at
            ? new Date(novel.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            : false,
        };
      });

      setNovels(processed);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovels();
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: false,
      mirror: true,
      offset: 50,
      delay: 0,
    });
    const handleResize = () => AOS.refresh();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // فلترة الروايات
  const filteredNovels = useMemo(() => {
    let filtered = novels;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          (n.author && n.author.toLowerCase().includes(query))
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((n) => n.category && n.category.includes(selectedCategory));
    }
    return filtered;
  }, [novels, searchQuery, selectedCategory]);

  // ترتيب الروايات
  const sortedNovels = useMemo(() => {
    const filtered = [...filteredNovels];
    switch (sortBy) {
      case "newest":
        return filtered.sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      case "oldest":
        return filtered.sort(
          (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
      case "title":
        return filtered.sort((a, b) => a.title.localeCompare(b.title, "ar"));
      default:
        return filtered;
    }
  }, [filteredNovels, sortBy]);

  const resetSearch = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSortBy("newest");
  }, []);

  const goToStory = (id: string) => {
    router.push(`/stories/${id}`);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.classList.add(styles.loaded);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/placeholder.png";
    e.currentTarget.classList.add(styles.error);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`${styles.star} ${i <= fullStars ? styles.filled : ""}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className={styles.novelsPage}>
      <div className={styles.animatedBg}>
        <div className={styles.bubble}></div>
        <div className={styles.bubble}></div>
        <div className={styles.bubble}></div>
      </div>

      <div className={styles.container}>
        <header className={styles.pageHeader} data-aos="fade-down" data-aos-duration="1000">
          <h1 className={styles.goldenText}>
            <span className={styles.titleIcon}>📚</span>
            مكتبة عُروبة
          </h1>
          <p className={styles.subtitle}>استكشف روائع الأدب العالمي بلسانٍ عربي مبين</p>
          <div className={styles.headerDecoration}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </header>

        <div className={styles.controlBar} data-aos="fade-up" data-aos-delay="200">
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="ابحث عن رواية..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
          </div>

          <div className={styles.resultsInfo}>
            <span className={styles.resultsCount}>{sortedNovels.length} نتيجة</span>
            <div className={styles.sortWrapper}>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">الأحدث</option>
                <option value="oldest">الأقدم</option>
                <option value="title">العنوان</option>
              </select>
            </div>
            <button
              className={styles.viewToggle}
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? "📋 قائمة" : "📱 شبكة"}
            </button>
          </div>

          <div className={styles.categoriesScroll}>
            {categories.map((cat) => (
              <button
                key={cat.name}
                className={`${styles.categoryChip} ${
                  selectedCategory === cat.name ? styles.active : ""
                }`}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat.name ? null : cat.name)
                }
              >
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catName}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className={styles.loadingState} data-aos="fade-up">
            <div className={styles.loader}></div>
            <p>جاري تحميل الكنوز الأدبية...</p>
            <div className={styles.skeletonGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}></div>
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className={styles.errorState} data-aos="fade-up">
            <span className={styles.errorIcon}>😞</span>
            <p>عذراً، حدث خطأ في تحميل الروايات. حاول لاحقاً.</p>
          </div>
        )}

        {!loading && !error && (
          <div
            className={`${styles.novelsContainer} ${
              viewMode === "grid" ? styles.gridView : styles.listView
            }`}
          >
            <div className={styles.novelsGrid}>
              {sortedNovels.map((novel, index) => (
                <div
                  key={novel.id}
                  className={styles.novelCardWrapper}
                  data-aos={viewMode === "grid" ? "fade-up" : "fade-right"}
                  data-aos-delay={viewMode === "grid" ? 50 * (index % 8) : 50 * index}
                >
                  <div className={styles.novelCard} onClick={() => goToStory(novel.id)}>
                    <div className={styles.cardImage}>
                      <img
                        src={getCoverUrl(novel.cover)}
                        alt={novel.title}
                        loading="lazy"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                      <div className={styles.imageOverlay}>
                        <span className={styles.readNow}>اقرأ الآن</span>
                      </div>
                      {novel.category && (
                        <div className={styles.cardBadge}>{novel.category}</div>
                      )}
                      {novel.isNew && (
                        <div className={`${styles.cardBadge} ${styles.left}`}>✨ جديد</div>
                      )}
                    </div>
                    <div className={styles.cardInfo}>
                      <h3>{novel.title}</h3>
                      <p className={styles.author}>{novel.author || "غير محدد"}</p>
                      <div className={styles.cardFooter}>
                        <span className={styles.pages}>{novel.chapters_count || 0} فصل</span>
                        <div className={styles.rating}>
                          <span className={styles.stars}>{renderStars(novel.avg_rating || 0)}</span>
                          <span className={styles.ratingValue}>({novel.total_ratings || 0})</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardGlow}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && filteredNovels.length === 0 && (
          <div className={styles.noResults} data-aos="fade-up">
            <span className={styles.noResultsIcon}>🔍</span>
            <p>عذراً، لا توجد رواية بهذا الاسم حالياً.</p>
            <button onClick={resetSearch} className={styles.resetBtn}>
              مسح البحث
            </button>
          </div>
        )}
      </div>
    </div>
  );
}