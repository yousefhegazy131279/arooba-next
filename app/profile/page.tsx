"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { supabase } from "@/lib/supabaseClient";
import styles from "./profile.module.css";
import AOS from "aos";
import "aos/dist/aos.css";

// أيقونات SVG حديثة
const CameraIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M3 21h18" /></svg>;
const HeartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const StarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const BookIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;

export default function ProfilePage() {
  const { user, isLoggedIn, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [stats, setStats] = useState({ favorites: 0, ratings: 0 });
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
    if (!authLoading && !isLoggedIn) router.push("/login?redirectTo=/profile");
    else if (user) {
      fetchProfile();
      fetchStats();
      fetchFavorites();
    }
  }, [authLoading, isLoggedIn, user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
    if (!error && data) {
      setProfile(data);
      setBio(data.bio || "");
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user) return;
    const { count: favCount } = await supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    const { count: rateCount } = await supabase.from("ratings").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    setStats({ favorites: favCount || 0, ratings: rateCount || 0 });
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
        setLoadingFavs(false);
        return;
      }

      const novelIds = favData.map((item) => item.novel_id);
      const { data: novelsData, error: novelsError } = await supabase
        .from("novels")
        .select("id, title, author, cover")
        .in("id", novelIds);

      if (novelsError) throw novelsError;

      const orderedNovels = novelIds
        .map((id) => novelsData?.find((novel) => novel.id === id))
        .filter(Boolean);
      setFavorites(orderedNovels);
    } catch (err: any) {
      console.error("Error fetching favorites:", err);
      alert(err?.message || "حدث خطأ أثناء تحميل المفضلات");
      setFavorites([]);
    } finally {
      setLoadingFavs(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
    if (uploadError) {
      alert("فشل رفع الصورة: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const avatarUrl = urlData.publicUrl;
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    if (updateError) alert("فشل تحديث الصورة: " + updateError.message);
    else {
      setProfile({ ...profile, avatar_url: avatarUrl });
      window.dispatchEvent(new Event("avatar-updated"));
    }
    setUploading(false);
  };

  const updateBio = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ bio }).eq("id", user.id);
    if (error) alert("فشل تحديث النبذة: " + error.message);
    else setEditingBio(false);
  };

  const handleRemoveFavorite = async (novelId: string) => {
    if (!user) return;
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("novel_id", novelId);
    setFavorites((prev) => prev.filter((fav) => fav.id !== novelId));
    setStats((prev) => ({ ...prev, favorites: prev.favorites - 1 }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.bgOrbs}>
        <div className={styles.orb1}></div>
        <div className={styles.orb2}></div>
        <div className={styles.orb3}></div>
      </div>

      <div className={styles.profileLayout}>
        {/* الشريط الجانبي الأيمن */}
        <aside className={styles.sidebar} data-aos="fade-left">
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "?"}
                </div>
              )}
              <label className={styles.uploadLabel}>
                <CameraIcon />
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {uploading && <div className={styles.uploadSpinner}></div>}
            </div>
            <h2 className={styles.userName}>{profile?.full_name || profile?.username || "مستخدم"}</h2>
            <p className={styles.userEmail}>{user?.email}</p>
            <p className={styles.userSince}>عضو منذ {new Date(profile?.created_at).toLocaleDateString("ar-EG")}</p>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <LogoutIcon /> خروج
            </button>
          </div>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className={styles.mainContent}>
          {/* إحصائيات سريعة - عدادان فقط */}
          <div className={styles.statsRow} data-aos="fade-up">
            <div className={styles.statCard}>
              <HeartIcon />
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>{stats.favorites}</span>
                <span className={styles.statLabel}>المفضلة</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <StarIcon />
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>{stats.ratings}</span>
                <span className={styles.statLabel}>التقييمات</span>
              </div>
            </div>
          </div>

          {/* نبذة شخصية */}
          <div className={styles.bioCard} data-aos="fade-up" data-aos-delay="100">
            <div className={styles.bioHeader}>
              <h3>نبذة عني</h3>
              {!editingBio ? (
                <button onClick={() => setEditingBio(true)} className={styles.editBtn}>
                  <EditIcon /> تعديل
                </button>
              ) : (
                <div className={styles.bioActions}>
                  <button onClick={updateBio} className={styles.saveBtn}>حفظ</button>
                  <button onClick={() => setEditingBio(false)} className={styles.cancelBtn}>إلغاء</button>
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
              />
            ) : (
              <p className={styles.bioText}>{bio || "لم تقم بإضافة نبذة بعد. اضغط على تعديل لإضافة نبذة عن نفسك."}</p>
            )}
          </div>

          {/* قائمة المفضلات */}
          <div className={styles.favoritesSection} data-aos="fade-up" data-aos-delay="200">
            <div className={styles.sectionHeader}>
              <h3>📚 رواياتي المفضلة</h3>
              {stats.favorites > 6 && (
                <Link href="/profile/favorites" className={styles.viewAllLink}>
                  عرض الكل ({stats.favorites})
                </Link>
              )}
            </div>
            {loadingFavs ? (
              <div className={styles.loadingFavs}>جاري التحميل...</div>
            ) : favorites.length === 0 ? (
              <div className={styles.emptyFavs}>
                <p>لا توجد روايات مفضلة بعد.</p>
                <Link href="/novels" className={styles.browseBtn}>استعرض الروايات</Link>
              </div>
            ) : (
              <div className={styles.favGrid}>
                {favorites.map((novel) => (
                  <div key={novel.id} className={styles.favCard}>
                    <Link href={`/stories/${novel.id}`} className={styles.favLink}>
                      {novel.cover ? (
                        <img src={novel.cover} alt={novel.title} className={styles.favCover} />
                      ) : (
                        <div className={styles.favNoCover}>📖</div>
                      )}
                      <div className={styles.favInfo}>
                        <h4 className={styles.favTitle}>{novel.title}</h4>
                        <p className={styles.favAuthor}>{novel.author}</p>
                      </div>
                    </Link>
                    <button onClick={() => handleRemoveFavorite(novel.id)} className={styles.removeFavBtn} title="إزالة من المفضلة">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
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