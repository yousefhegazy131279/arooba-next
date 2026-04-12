'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./Novels.module.css";
import { supabase } from "@/lib/supabaseClient";
import CardFavoriteButton from "@/app/components/CardFavoriteButton";

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

// أيقونات SVG راقية بدلاً من الإيموجي
const icons = {
  books: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  list: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  categories: {
    classics: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    adventure: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    scifi: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
    drama: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 12v-4a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v4" />
        <rect x="2" y="12" width="20" height="8" rx="2" />
      </svg>
    ),
    history: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
        <line x1="12" y1="2" x2="12" y2="4" />
      </svg>
    ),
    romance: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    mystery: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  error: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  noResults: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  newBadge: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

const categories = [
  { name: "كلاسيكيات", icon: icons.categories.classics },
  { name: "مغامرات", icon: icons.categories.adventure },
  { name: "خيال علمي", icon: icons.categories.scifi },
  { name: "دراما", icon: icons.categories.drama },
  { name: "تاريخية", icon: icons.categories.history },
  { name: "رومانسية", icon: icons.categories.romance },
  { name: "غموض", icon: icons.categories.mystery },
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchNovels = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data: novelsData, error: novelsError } = await supabase
        .from('novels')
        .select('*')
        .order('created_at', { ascending: false });

      if (novelsError) throw novelsError;
      if (!novelsData) throw new Error('No data');

      const novelIds = novelsData.map(n => n.id);
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('novel_id, rating')
        .in('novel_id', novelIds);

      if (ratingsError) throw ratingsError;

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
  }, [refreshTrigger]);

  const handleFavoriteToggle = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
          {icons.star}
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
            <span className={styles.titleIcon}>{icons.books}</span>
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
            <span className={styles.searchIcon}>{icons.search}</span>
            <input
              type="text"
              placeholder="ابحث عن رواية..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={() => setSearchQuery("")}>
                {icons.close}
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
              {viewMode === "grid" ? icons.list : icons.grid}
              <span style={{ marginRight: "6px" }}>{viewMode === "grid" ? "قائمة" : "شبكة"}</span>
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
            <span className={styles.errorIcon}>{icons.error}</span>
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
                        <div className={`${styles.cardBadge} ${styles.left}`}>
                          {icons.newBadge} جديد
                        </div>
                      )}
                      {/* زر المفضلة */}
                      <div className={styles.favoriteWrapper}>
                        <CardFavoriteButton 
                          novelId={novel.id} 
                          onToggle={handleFavoriteToggle}
                        />
                      </div>
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
            <span className={styles.noResultsIcon}>{icons.noResults}</span>
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