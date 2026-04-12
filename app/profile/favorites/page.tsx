'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { getFavorites, removeFavorite } from '@/app/admin/actions';
import styles from './Favorites.module.css';

interface Favorite {
  id: string;
  novel_id: string;
  created_at: string;
  novels: {
    id: string;
    title: string;
    author: string;
    cover: string;
    category: string;
    chapters_count: number;
  };
}

export default function FavoritesPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      mirror: true,
      offset: 50,
    });
    const handleResize = () => AOS.refresh();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirectTo=/profile/favorites');
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchFavorites();
    }
  }, [isLoggedIn, user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await getFavorites(user!.id);
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (novelId: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذه الرواية من المفضلة؟')) return;
    try {
      await removeFavorite(user!.id, novelId);
      setFavorites(prev => prev.filter(f => f.novel_id !== novelId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('حدث خطأ، حاول مرة أخرى');
    }
  };

  const goToStory = (id: string) => {
    router.push(`/stories/${id}`);
  };

  const getCoverUrl = (coverPath: string): string => {
    if (!coverPath) return '';
    if (coverPath.startsWith('http')) return coverPath;
    if (coverPath.startsWith('/covers/')) return coverPath;
    return `/covers/${coverPath}`;
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loader}></div>
        <p>جاري تحميل المفضلات...</p>
      </div>
    );
  }

  return (
    <div className={styles.favoritesPage}>
      {/* خلفية متحركة */}
      <div className={styles.animatedBg}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.container}>
        <div className={styles.header} data-aos="fade-down" data-aos-duration="1000">
          <div className={styles.headerIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h1 className={styles.title} data-aos="fade-up" data-aos-delay="200">المفضلات</h1>
          <p className={styles.subtitle} data-aos="fade-up" data-aos-delay="300">رواياتك المفضلة في مكان واحد</p>
          <div className={styles.titleDecoration} data-aos="zoom-in" data-aos-delay="400">
            <span className={styles.decorationLine}></span>
            <span className={styles.decorationStar}>✨</span>
            <span className={styles.decorationLine}></span>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className={styles.emptyState} data-aos="fade-up" data-aos-duration="800">
            <div className={styles.emptyIcon}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h3>لا توجد روايات في المفضلة بعد</h3>
            <p>أضف الروايات التي تعجبك إلى قائمة مفضلاتك لتجدها هنا</p>
            <button onClick={() => router.push('/novels')} className={styles.exploreBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              استكشف الروايات
            </button>
          </div>
        ) : (
          <div className={styles.favoritesGrid}>
            {favorites.map((fav, index) => (
              <div
                key={fav.id}
                className={styles.favoriteCard}
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay={index * 50}
              >
                <div className={styles.cardImage} onClick={() => goToStory(fav.novels.id)}>
                  {fav.novels.cover ? (
                    <img
                      src={getCoverUrl(fav.novels.cover)}
                      alt={fav.novels.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.noImage}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    </div>
                  )}
                  <div className={styles.imageOverlay}>
                    <span className={styles.readNow}>اقرأ الآن</span>
                  </div>
                  {fav.novels.category && (
                    <div className={styles.cardBadge}>{fav.novels.category}</div>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <h3 onClick={() => goToStory(fav.novels.id)}>{fav.novels.title}</h3>
                  <p className={styles.author}>{fav.novels.author || 'غير محدد'}</p>
                  <div className={styles.cardFooter}>
                    <div className={styles.stats}>
                      <span className={styles.chapters}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        {fav.novels.chapters_count || 0} فصل
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemove(fav.novels.id)}
                      className={styles.removeBtn}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                      إزالة
                    </button>
                  </div>
                </div>
                <div className={styles.cardGlow}></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}