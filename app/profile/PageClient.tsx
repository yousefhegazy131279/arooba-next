"use client";

import { showToast } from '@/lib/toast';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { supabase } from "@/lib/supabaseClient";
import { setFavoriteNovel } from "@/app/community/social/actions";
import styles from "./profile.module.css";
import AOS from "aos";
import "aos/dist/aos.css";

/* ==========================================================
   🧩 الأنواع
   ========================================================== */
type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  favorite_novel_id: number | null;
};

type FavoriteNovel = {
  id: number;
  title: string;
  author: string | null;
  cover: string | null;
};

type CommunityPost = {
  id: string;
  content: string;
  created_at: string;
  likes_count: number | null;
  comments_count: number | null;
};

type WriterWork = {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
  community_post_id: string | null;
};

/* ==========================================================
   🎨 أيقونات SVG
   ========================================================== */
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 3l4 4-7 7H10v-4l7-7z" />
    <path d="M3 21h18" />
  </svg>
);

const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const StarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const PostIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.7-.8L3 21l1.8-5.8a8.5 8.5 0 0 1-.8-3.7A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" />
  </svg>
);

const PenIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* ==========================================================
   🧠 أدوات مساعدة
   ========================================================== */
function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return then.toLocaleDateString("ar-EG");
}

/* ==========================================================
   🧩 المكوّن الرئيسي
   ========================================================== */
export default function ProfilePage() {
  const { user, isLoggedIn, loading: authLoading } = useAuthStore();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [stats, setStats] = useState({ favorites: 0, ratings: 0, posts: 0, works: 0 });
  const [favorites, setFavorites] = useState<FavoriteNovel[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [works, setWorks] = useState<WriterWork[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [savingFeatured, setSavingFeatured] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
    if (!authLoading && !isLoggedIn) router.push("/login?redirectTo=/profile");
    else if (user) {
      void fetchProfile();
      void fetchStats();
      void fetchFavorites();
      void fetchActivity();
    }
  }, [authLoading, isLoggedIn, user]);

  /* ---------- جلب البيانات ---------- */
  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();
    if (!error && data) {
      setProfile(data as Profile);
      setBio(data.bio || "");
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user) return;
    const [fav, rate, pst, wrk] = await Promise.all([
      supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("ratings").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_hidden", false),
      supabase.from("writer_works").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    setStats({
      favorites: fav.count || 0,
      ratings: rate.count || 0,
      posts: pst.count || 0,
      works: wrk.count || 0,
    });
  };

  const fetchFavorites = async () => {
    setLoadingFavs(true);
    try {
      const { data: favData, error: favError } = await supabase
        .from("favorites")
        .select("novel_id")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (favError) throw favError;
      if (!favData || favData.length === 0) {
        setFavorites([]);
        return;
      }

      const novelIds = favData.map((item) => item.novel_id);
      const { data: novelsData, error: novelsError } = await supabase
        .from("novels")
        .select("id, title, author, cover")
        .in("id", novelIds);

      if (novelsError) throw novelsError;

      const ordered = novelIds
        .map((id) => novelsData?.find((n) => n.id === id))
        .filter(Boolean);
      setFavorites(ordered as FavoriteNovel[]);
    } catch (err: unknown) {
      console.error("Error fetching favorites:", err);
      showToast.error(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل المفضلات");
      setFavorites([]);
    } finally {
      setLoadingFavs(false);
    }
  };

  const fetchActivity = async () => {
    if (!user) return;
    setLoadingActivity(true);
    try {
      const [postsRes, worksRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id, content, created_at, likes_count, comments_count")
          .eq("user_id", user.id)
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("writer_works")
          .select("id, title, description, updated_at, community_post_id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(3),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (worksRes.error) throw worksRes.error;

      setPosts((postsRes.data || []) as CommunityPost[]);
      setWorks((worksRes.data || []) as WriterWork[]);
    } catch (err: unknown) {
      console.error("Error fetching activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  /* ---------- إجراءات ---------- */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
    if (uploadError) {
      showToast.error("فشل رفع الصورة: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const avatarUrl = urlData.publicUrl;
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    if (updateError) showToast.error("فشل تحديث الصورة: " + updateError.message);
    else {
      setProfile((c) => (c ? { ...c, avatar_url: avatarUrl } : c));
      window.dispatchEvent(new Event("avatar-updated"));
    }
    setUploading(false);
  };

  const updateBio = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ bio }).eq("id", user.id);
    if (error) showToast.error("فشل تحديث النبذة: " + error.message);
    else setEditingBio(false);
  };

  const handleRemoveFavorite = async (novelId: number) => {
    if (!user) return;
    const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("novel_id", novelId);
    if (error) {
      showToast.error("تعذّر إزالة الرواية من المفضلات");
      return;
    }
    if (profile?.favorite_novel_id === novelId) {
      setProfile((c) => (c ? { ...c, favorite_novel_id: null } : c));
    }
    setFavorites((prev) => prev.filter((fav) => fav.id !== novelId));
    setStats((prev) => ({ ...prev, favorites: prev.favorites - 1 }));
  };

  const chooseFeaturedNovel = async (novelId: number | null) => {
    setSavingFeatured(true);
    try {
      const result = await setFavoriteNovel(novelId);
      setProfile((c) => (c ? { ...c, favorite_novel_id: result.favorite_novel_id } : c));
      showToast.success(novelId === null ? "أُزيلت الرواية من ملف المجتمع" : "ظهرت روايتك المفضلة في ملف المجتمع");
    } catch (issue) {
      showToast.error(issue instanceof Error ? issue.message : "تعذّر حفظ الرواية المفضلة");
    } finally {
      setSavingFeatured(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  /* ---------- تحميل ---------- */
  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  /* ---------- عرض ---------- */
  return (
    <div className={styles.profilePage}>
      {/* الخلفيات المتحركة */}
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={styles.orb1}></div>
        <div className={styles.orb2}></div>
        <div className={styles.orb3}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.profileLayout}>
        {/* ===== الشريط الجانبي ===== */}
        <aside className={styles.sidebar} data-aos="fade-left">
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarRing}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "؟"}
                  </div>
                )}
              </div>
              <label className={styles.uploadLabel} title="تغيير الصورة">
                <CameraIcon />
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {uploading && <div className={styles.uploadSpinner}></div>}
            </div>

            <h2 className={styles.userName}>
              {profile?.full_name || profile?.username || "مستخدم"}
            </h2>
            {profile?.username && (
              <p className={styles.userHandle}>@{profile.username}</p>
            )}
            <p className={styles.userEmail}>{user?.email}</p>
            {profile?.created_at && (
              <p className={styles.userSince}>
                عضو منذ {new Date(profile.created_at).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            )}

            <div className={styles.sidebarDivider} />

            <button onClick={handleLogout} className={styles.logoutBtn} type="button">
              <LogoutIcon /> تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* ===== المحتوى الرئيسي ===== */}
        <main className={styles.mainContent}>
          {/* الإحصائيات */}
          <div className={styles.statsRow} data-aos="fade-up">
            <div className={`${styles.statCard} ${styles.statGold}`}>
              <HeartIcon />
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>{stats.favorites}</span>
                <span className={styles.statLabel}>المفضلة</span>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statBlue}`}>
              <StarIcon />
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>{stats.ratings}</span>
                <span className={styles.statLabel}>التقييمات</span>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statGreen}`}>
              <PostIcon />
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>{stats.posts}</span>
                <span className={styles.statLabel}>المنشورات</span>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statPurple}`}>
              <PenIcon />
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>{stats.works}</span>
                <span className={styles.statLabel}>الكتابات</span>
              </div>
            </div>
          </div>

          {/* نبذة شخصية */}
          <div className={styles.bioCard} data-aos="fade-up" data-aos-delay="100">
            <div className={styles.bioHeader}>
              <h3>
                <span className={styles.sectionBadge}>نبذة</span>
                عني
              </h3>
              {!editingBio ? (
                <button onClick={() => setEditingBio(true)} className={styles.editBtn} type="button">
                  <EditIcon /> تعديل
                </button>
              ) : (
                <div className={styles.bioActions}>
                  <button onClick={updateBio} className={styles.saveBtn} type="button">حفظ</button>
                  <button onClick={() => setEditingBio(false)} className={styles.cancelBtn} type="button">إلغاء</button>
                </div>
              )}
            </div>
            {editingBio ? (
              <textarea
                className={styles.bioTextarea}
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اكتب شيئاً عن نفسك..."
                maxLength={400}
              />
            ) : (
              <p className={styles.bioText}>
                {bio || "لم تقم بإضافة نبذة بعد. اضغط على تعديل لإضافة نبذة عن نفسك."}
              </p>
            )}
          </div>

          {/* المفضلة */}
          <div className={styles.favoritesSection} data-aos="fade-up" data-aos-delay="200">
            <div className={styles.sectionHeader}>
              <div>
                <h3><span className={styles.sectionBadge}>المفضلة</span> رواياتي</h3>
                <p className={styles.featuredHint}>
                  اختر رواية واحدة لتظهر للقرّاء والكتّاب في ملفك بالمجتمع.
                </p>
              </div>
              {stats.favorites > 6 && (
                <Link href="/profile/favorites" className={styles.viewAllLink}>
                  عرض الكل ({stats.favorites}) <ArrowLeftIcon />
                </Link>
              )}
            </div>

            {loadingFavs ? (
              <div className={styles.skeletonRow}>
                {[...Array(3)].map((_, i) => <div key={i} className={styles.skeletonCard} />)}
              </div>
            ) : favorites.length === 0 ? (
              <div className={styles.emptyFavs}>
                <div className={styles.emptyIcon}>📚</div>
                <p className={styles.emptyTitle}>لا توجد روايات مفضلة بعد</p>
                <p className={styles.emptyText}>احفظ رواياتك المفضلة لتظهر هنا</p>
                <Link href="/novels" className={styles.browseBtn}>استعرض الروايات</Link>
              </div>
            ) : (
              <div className={styles.favGrid}>
                {favorites.map((novel) => {
                  const isFeatured = String(profile?.favorite_novel_id) === String(novel.id);
                  return (
                    <div key={novel.id} className={`${styles.favCard} ${isFeatured ? styles.favCardFeatured : ""}`}>
                      <Link href={`/stories/${novel.id}`} className={styles.favLink}>
                        {novel.cover ? (
                          <img src={novel.cover} alt={novel.title} className={styles.favCover} />
                        ) : (
                          <div className={styles.favNoCover}>📖</div>
                        )}
                        <div className={styles.favInfo}>
                          <h4 className={styles.favTitle}>{novel.title}</h4>
                          <p className={styles.favAuthor}>{novel.author || "كاتب عُروبة"}</p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        className={styles.featuredButton}
                        disabled={savingFeatured}
                        aria-pressed={isFeatured}
                        onClick={() => void chooseFeaturedNovel(isFeatured ? null : Number(novel.id))}
                      >
                        {isFeatured ? "★ مختارة · إزالة" : "☆ عرضها في المجتمع"}
                      </button>
                      <button
                        onClick={() => handleRemoveFavorite(novel.id)}
                        className={styles.removeFavBtn}
                        title="إزالة من المفضلة"
                        type="button"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===== منشوراتي من المجتمع ===== */}
          <div className={styles.activitySection} data-aos="fade-up" data-aos-delay="300">
            <div className={styles.sectionHeader}>
              <div>
                <h3><span className={styles.sectionBadge}>المجتمع</span> منشوراتي</h3>
                <p className={styles.featuredHint}>
                  آخر مشاركاتك في مجتمع عُروبة.
                </p>
              </div>
              {stats.posts > 3 && (
                <Link href="/community/user/posts" className={styles.viewAllLink}>
                  عرض الكل ({stats.posts}) <ArrowLeftIcon />
                </Link>
              )}
            </div>

            {loadingActivity ? (
              <div className={styles.skeletonRow}>
                {[...Array(2)].map((_, i) => <div key={i} className={styles.skeletonCard} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className={styles.emptyFavs}>
                <div className={styles.emptyIcon}>💬</div>
                <p className={styles.emptyTitle}>لم تنشر شيئاً بعد</p>
                <p className={styles.emptyText}>شارك أول منشور لك مع مجتمع عُروبة</p>
                <Link href="/community/create" className={styles.browseBtn}>أنشئ منشوراً</Link>
              </div>
            ) : (
              <div className={styles.postsList}>
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/post/${post.id}`}
                    className={styles.postItem}
                  >
                    <div className={styles.postHeader}>
                      <span className={styles.postTime}>{timeAgo(post.created_at)}</span>
                      <span className={styles.postLink}>قراءة <ExternalIcon /></span>
                    </div>
                    <p className={styles.postContent}>{post.content}</p>
                    <div className={styles.postStats}>
                      <span>♥ {post.likes_count || 0}</span>
                      <span>💬 {post.comments_count || 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ===== كتاباتي ===== */}
          <div className={styles.activitySection} data-aos="fade-up" data-aos-delay="400">
            <div className={styles.sectionHeader}>
              <div>
                <h3><span className={styles.sectionBadge}>مساحة الكتابة</span> كتاباتي</h3>
                <p className={styles.featuredHint}>
                  أعمالك الأدبية قيد التطوير، جاهزة للمتابعة في أي وقت.
                </p>
              </div>
              {stats.works > 3 && (
                <Link href="/write" className={styles.viewAllLink}>
                  إدارة الأعمال <ArrowLeftIcon />
                </Link>
              )}
            </div>

            {loadingActivity ? (
              <div className={styles.skeletonRow}>
                {[...Array(2)].map((_, i) => <div key={i} className={styles.skeletonCard} />)}
              </div>
            ) : works.length === 0 ? (
              <div className={styles.emptyFavs}>
                <div className={styles.emptyIcon}>✍</div>
                <p className={styles.emptyTitle}>لم تبدأ عملاً بعد</p>
                <p className={styles.emptyText}>افتح مساحة الكتابة وابدأ عملك الأول</p>
                <Link href="/write" className={styles.browseBtn}>ابدأ الكتابة</Link>
              </div>
            ) : (
              <div className={styles.worksGrid}>
                {works.map((work) => (
                  <div key={work.id} className={styles.workCard}>
                    <div className={styles.workMark} aria-hidden="true">✍</div>
                    <h4 className={styles.workTitle}>{work.title}</h4>
                    <p className={styles.workDesc}>
                      {work.description || "مسودة محفوظة في مكتبتك الخاصة."}
                    </p>
                    <span className={styles.workDate}>
                      آخر تعديل {new Date(work.updated_at).toLocaleDateString("ar-EG")}
                    </span>
                    <div className={styles.workActions}>
                      <Link href={`/write/${work.id}`} className={styles.workContinue}>
                        تابع الكتابة <ArrowLeftIcon />
                      </Link>
                      {work.community_post_id && (
                        <Link href={`/community/post/${work.community_post_id}`} className={styles.workCommunity}>
                          المنشور <ExternalIcon />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}