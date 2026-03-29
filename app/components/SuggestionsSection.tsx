'use client';

import { useEffect, useState, useRef } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import styles from './SuggestionsSection.module.css';
import { supabase } from '@/lib/supabaseClient';

interface Suggestion {
  id: number;
  name: string;
  story_title: string;
  comment: string | null;
  created_at: string;
}

const avatarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

const getAvatarColor = (name: string) => {
  if (!name) return avatarColors[0];
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'اليوم';
    if (diff === 1) return 'أمس';
    if (diff < 7) return `منذ ${diff} أيام`;

    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

export default function SuggestionsSection() {
  const [form, setForm] = useState({ name: '', story_title: '', comment: '' });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // جلب الاقتراحات
  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setErrorMessage('فشل في تحميل الاقتراحات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();

    // تهيئة AOS
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      mirror: true,
      anchorPlacement: 'top-bottom',
    });

    const handleResize = () => AOS.refresh();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.story_title) {
      setErrorMessage('الرجاء إدخال الاسم واسم الرواية');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          name: form.name,
          story_title: form.story_title,
          comment: form.comment || null,
        })
        .select()
        .single();

      if (error) throw error;

      // إضافة الاقتراح الجديد إلى أعلى القائمة
      setSuggestions(prev => [data, ...prev]);
      setForm({ name: '', story_title: '', comment: '' });
      setShowSuccess(true);

      // تمرير القائمة لأعلى
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error submitting:', err);
      setErrorMessage(err.message || 'حدث خطأ في الإرسال');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.suggestionsSection}>
      {/* خلفية متحركة */}
      <div className={styles.sectionBackground}>
        <div className={`${styles.bgOrb} ${styles.orb1}`}></div>
        <div className={`${styles.bgOrb} ${styles.orb2}`}></div>
        <div className={`${styles.bgOrb} ${styles.orb3}`}></div>
        <div className={styles.gridOverlay}></div>
        <div className={styles.floatingShapes}>
          <span className={`${styles.shape} ${styles.shape1}`}>📚</span>
          <span className={`${styles.shape} ${styles.shape2}`}>✨</span>
          <span className={`${styles.shape} ${styles.shape3}`}>💭</span>
          <span className={`${styles.shape} ${styles.shape4}`}>📖</span>
        </div>
      </div>

      <div className={styles.container}>
        {/* ترويسة القسم */}
        <div className={styles.sectionHeader} data-aos="fade-down" data-aos-duration="1000">
          <span className={styles.sectionBadge} data-aos="zoom-in" data-aos-delay="200">
            <span className={styles.badgeIcon}>💡</span>
            شاركنا برأيك
          </span>

          <h2 className={styles.sectionTitle}>
            <span className={styles.titleWord} data-aos="fade-left" data-aos-delay="300">هل لديك</span>
            <span className={`${styles.titleWord} ${styles.gold}`} data-aos="fade-up" data-aos-delay="400">قصة</span>
            <span className={styles.titleWord} data-aos="fade-right" data-aos-delay="500">تود تعريبها؟</span>
          </h2>

          <p className={styles.subtitle} data-aos="fade-up" data-aos-delay="600">
            شاركونا اقتراحاتكم لننشر سحر لغة الضاد في قصصكم المفضلة
          </p>

          <div className={styles.titleDecoration} data-aos="zoom-in" data-aos-delay="700">
            <span className={styles.decorationLine}></span>
            <span className={styles.decorationStar}>✨</span>
            <span className={styles.decorationLine}></span>
          </div>
        </div>

        <div className={styles.flexLayout}>
          {/* الفورم */}
          <div className={styles.formWrapper} data-aos="fade-left" data-aos-duration="1200" data-aos-delay="200">
            <form className={styles.suggestionForm} onSubmit={handleSubmit}>
              <div className={styles.formHeader}>
                <div className={styles.formIconWrapper} data-aos="flip-right" data-aos-delay="300">
                  <span className={styles.formIcon}>✍️</span>
                </div>
                <h3 data-aos="fade-right" data-aos-delay="400">أضف اقتراحك</h3>
              </div>

              {/* حقل الاسم */}
              <div className={styles.inputGroup} data-aos="fade-up" data-aos-delay="500">
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="اسمك"
                    className={`${styles.floatingInput} ${form.name ? styles.hasValue : ''}`}
                  />
                  <span className={styles.inputIcon}></span>
                  <div className={styles.inputBorder}></div>
                </div>
              </div>

              {/* حقل اسم الرواية */}
              <div className={styles.inputGroup} data-aos="fade-up" data-aos-delay="600">
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    value={form.story_title}
                    onChange={(e) => setForm({ ...form, story_title: e.target.value })}
                    required
                    placeholder="اسم الرواية المقترحة"
                    className={`${styles.floatingInput} ${form.story_title ? styles.hasValue : ''}`}
                  />
                  <span className={styles.inputIcon}></span>
                  <div className={styles.inputBorder}></div>
                </div>
              </div>

              {/* حقل التعليق */}
              <div className={styles.inputGroup} data-aos="fade-up" data-aos-delay="700">
                <div className={styles.inputWrapper}>
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    rows={3}
                    placeholder="لماذا تود رؤية هذه القصة بالعربية؟"
                    className={`${styles.floatingInput} ${form.comment ? styles.hasValue : ''}`}
                  />
                  <span className={styles.inputIcon}></span>
                  <div className={styles.inputBorder}></div>
                </div>
              </div>

              {/* رسالة خطأ */}
              {errorMessage && (
                <div className={styles.errorMessage} data-aos="zoom-in">
                  <span className={styles.errorIcon}>⚠️</span>
                  {errorMessage}
                </div>
              )}

              {/* زر الإرسال */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitBtn}
                data-aos="zoom-in"
                data-aos-delay="900"
              >
                <span className={styles.btnContent}>
                  {!isSubmitting ? (
                    <>
                      إرسال الاقتراح
                      <span className={styles.btnIcon}></span>
                    </>
                  ) : (
                    <span className={styles.loadingContainer}>
                      <span className={styles.loaderSmall}></span>
                      جاري الإرسال...
                    </span>
                  )}
                </span>
                <span className={styles.btnGlow}></span>
              </button>

              {/* رسالة نجاح */}
              {showSuccess && (
                <div className={styles.successMessage}>
                  <div className={styles.successIcon}>✅</div>
                  <div className={styles.successContent}>
                    <h4>تم الإرسال بنجاح!</h4>
                    <p>شكراً لمشاركتنا اقتراحك</p>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* جدار الاقتراحات */}
          <div className={styles.commentsWrapper} data-aos="fade-right" data-aos-duration="1200" data-aos-delay="300">
            <div className={styles.commentsWall}>
              <div className={styles.wallHeader}>
                <div className={styles.headerLeft}>
                  <span className={styles.wallIcon}>🗣️</span>
                  <h3 className={styles.wallTitle}>آخر الاقتراحات</h3>
                </div>
                <div className={styles.suggestionsCount}>
                  <span className={styles.countNumber}>{suggestions.length}</span>
                  <span className={styles.countLabel}>اقتراح</span>
                </div>
              </div>

              {/* حالة التحميل */}
              {loading ? (
                <div className={styles.loadingWall}>
                  <div className={styles.loader}></div>
                  <p>جاري تحميل الاقتراحات...</p>
                  <div className={styles.loadingProgress}>
                    <div className={styles.progressBar}></div>
                  </div>
                </div>
              ) : (
                <div className={styles.commentsList} ref={commentsContainerRef}>
                  <div className={styles.listWrapper}>
                    {suggestions.length === 0 ? (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyAnimation}>
                          <span className={styles.emptyIcon}>💭</span>
                          <div className={styles.emptyCircles}>
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                        <h4>لا توجد اقتراحات بعد</h4>
                        <p>كن أول من يقترح قصة لتعريبها!</p>
                      </div>
                    ) : (
                      suggestions.map((item, index) => (
                        <div
                          key={item.id}
                          className={styles.commentCard}
                          data-aos={index % 2 === 0 ? 'flip-right' : 'flip-left'}
                          data-aos-delay={200 + (index * 50)}
                        >
                          <div className={styles.cardGlow}></div>
                          <div className={styles.cardHeader}>
                            <div
                              className={styles.userAvatar}
                              style={{ backgroundColor: getAvatarColor(item.name) }}
                            >
                              {item.name.charAt(0) || '?'}
                              <div className={styles.avatarGlow}></div>
                            </div>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>{item.name}</span>
                              <span className={styles.commentDate}>
                                <span className={styles.dateIcon}>⏱️</span>
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                            {index === 0 && <div className={styles.cardBadge}>جديد</div>}
                          </div>
                          <div className={styles.commentContent}>
                            <div className={styles.storyBadge}>
                              <span className={styles.badgeIcon}>📖</span>
                              <span className={styles.badgeText}>رواية مقترحة</span>
                            </div>
                            <p className={styles.storyTitle}>
                              <strong>{item.story_title}</strong>
                            </p>
                            {item.comment && (
                              <p className={styles.commentText}>
                                <span className={styles.quoteIcon}>"</span>
                                {item.comment}
                                <span className={`${styles.quoteIcon} ${styles.closing}`}>"</span>
                              </p>
                            )}
                          </div>
                          <div className={styles.cardFooter}>
                            <div className={styles.reactions}>
                              {/* يمكن إضافة ردود فعل لاحقاً */}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* عناصر زخرفية سفلية */}
      <div className={styles.bottomDecoration}>
        <div className={`${styles.wave} ${styles.wave1}`}></div>
        <div className={`${styles.wave} ${styles.wave2}`}></div>
      </div>
    </section>
  );
}