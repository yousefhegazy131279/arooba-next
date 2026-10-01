'use client';

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import styles from './About.module.css';

export default function AboutPage() {
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

  return (
    <div className={styles.aboutPage}>
      {/* ===== قسم البطل (Hero) ===== */}
      <header className={styles.aboutHero}>
        <div className={styles.heroBackground}>
          <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
          <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
          <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
          <div className={styles.gridOverlay}></div>
        </div>

        <div className={styles.container}>
          <div className={styles.heroContent} data-aos="fade-up" data-aos-duration="1200">
            <span className={styles.heroBadge}>من نحن</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleWord}>عن</span>
              <span className={`${styles.titleWord} ${styles.gold}`}>عُروبة</span>
            </h1>
            <p className={styles.heroSubtitle}>
              منصة أدبية عربية متكاملة — اقرأ، اكتب، عرّب، وشارك
            </p>
            <div className={styles.heroDecoration}>
              <span className={styles.decorationLine}></span>
              <span className={styles.decorationStar}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </span>
              <span className={styles.decorationLine}></span>
            </div>
          </div>
        </div>

        <div className={styles.floatingShapes}>
          <span className={`${styles.shape} ${styles.shape1}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape2}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 3l4 4-7 7H10v-4l7-7z" />
              <path d="M3 21h18" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape3}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape4}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
        </div>
      </header>

      {/* ===== قسم المحتوى الرئيسي ===== */}
      <section className={styles.contentSection}>
        <div className={styles.container}>

          {/* ===== صورة المؤسس والنبذة ===== */}
          <div className={styles.founderSection} data-aos="fade-up" data-aos-duration="1000">
            <div className={styles.founderImageWrapper}>
              <img src="/founder.png" alt="مؤسس عُروبة" className={styles.founderImage} />
              <div className={styles.imageGlow}></div>
              <div className={styles.imageFrame}></div>
            </div>
            <div className={styles.founderQuote}>
              <span className={styles.quoteIcon}>❝</span>
              <p>
                مؤمن بأن الأدب العربي من أجمل ما كُتب، وأن لغتنا قادرة على حمل
                أعظم الحكايات — وأن كل قارئ هو كاتبٌ ينتظر أن يُولَد.
              </p>
              <span className={styles.quoteAuthor}>— يوسف حجازي، مؤسس عُروبة</span>
            </div>
          </div>

          {/* ===== بطاقات: حكايتنا + رؤيتنا ===== */}
          <div className={styles.aboutGrid}>
            <div className={styles.aboutCard} data-aos="fade-left" data-aos-delay="200">
              <h2 className={styles.goldenText}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                حكايتنا
              </h2>
              <p>
                بدأت "عُروبة" كمحاولة لتقريب الأدب العالمي إلى القارئ العربي،
                بعد أن لاحظنا أن كثيراً من الروايات العظيمة بقيت بعيدة عن
                القارئ العربي بسبب حاجز اللغة.
              </p>
              <p>
                لكن الرحلة لم تتوقف عند التعريب. توسّعت "عُروبة" لتصبح
                <strong> فضاءً أدبياً كاملاً </strong>
                يجمع القرّاء والكتّاب والمترجمين في مكان واحد.
              </p>
              <p>
                من مكتبة متنامية، إلى قارئ تفاعلي، إلى محرر عربي متكامل، إلى
                مجتمع يناقش ويشارك — أصبحت "عُروبة" بيتاً للحكايات بلغة الضاد.
              </p>
            </div>

            <div className={styles.aboutCard} data-aos="fade-right" data-aos-delay="300">
              <h2 className={styles.goldenText}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
                </svg>
                رؤيتنا
              </h2>
              <p>
                نطمح أن تصبح "عُروبة" المنصة العربية الأولى التي يحتضن فيها
                القارئ حكايته، ويجد فيها الكاتب مساحته، ويجد فيها المترجم
                منبره، ويناقش فيها المجتمع أفكاره.
              </p>
              <p>
                نبني جسراً بين الأدب العالمي والقارئ العربي، وحاضنةً للأصوات
                الأدبية العربية الجديدة التي تستحق أن تُسمَع.
              </p>
              <div className={styles.visionStats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>+</span>
                  <span className={styles.statLabel}>روايات مُعرَّبة</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>+</span>
                  <span className={styles.statLabel}>أعمال أصلية</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>+</span>
                  <span className={styles.statLabel}>قارئ وكاتب</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== NEW: ما الذي تقدمه عُروبة؟ (الركائز الأربع) ===== */}
          <div className={styles.pillarsSection} data-aos="fade-up" data-aos-duration="1000">
            <h2 className={styles.sectionTitle}>
              <span>ما الذي تقدمه</span>
              <span className={styles.gold}>عُروبة</span>
              <span>؟</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              أربع بوابات تجعل من "عُروبة" تجربة أدبية متكاملة
            </p>

            <div className={styles.pillarsGrid}>
              <div className={styles.pillarCard} data-aos="fade-up" data-aos-delay="100">
                <div className={styles.pillarIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <h3>اقرأ</h3>
                <p>
                  مكتبة متجددة من الروايات المُعرَّبة والأعمال الأصلية، مع قارئ
                  تفاعلي يحفظ موضعك ويوفر إعدادات مريحة.
                </p>
              </div>

              <div className={styles.pillarCard} data-aos="fade-up" data-aos-delay="200">
                <div className={styles.pillarIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                    <path d="M3 21h18" />
                  </svg>
                </div>
                <h3>اكتب</h3>
                <p>
                  محرر عربي غني يشبه Word، مع حفظ تلقائي، وتصدير DOCX، وإمكانية
                  نشر عملك في المجتمع بضغطة واحدة.
                </p>
              </div>

              <div className={styles.pillarCard} data-aos="fade-up" data-aos-delay="300">
                <div className={styles.pillarIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3>عرّب</h3>
                <p>
                  انقل روائع الأدب العالمي إلى العربية بأسلوب راقٍ، وانشرها
                  باسمك في مكتبة "عُروبة" عبر مساحة الكتابة.
                </p>
              </div>

              <div className={styles.pillarCard} data-aos="fade-up" data-aos-delay="400">
                <div className={styles.pillarIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3>شارك</h3>
                <p>
                  مجتمع أدبي حيّ: انشر أفكارك، تابع الكتّاب، تبادل الرسائل
                  الخاصة، وابنِ جمهورك.
                </p>
              </div>
            </div>
          </div>

          {/* ===== قسم: لماذا عُروبة؟ ===== */}
          <div className={styles.missionSection} data-aos="fade-up" data-aos-duration="1000">
            <h2 className={styles.sectionTitle}>
              <span>لماذا</span>
              <span className={styles.gold}>عُروبة</span>
              <span>؟</span>
            </h2>

            <div className={styles.featuresGrid}>
              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="100">
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <h3>تعريب فني</h3>
                <p>لا نترجم الكلمات، بل ننقل الأحاسيس والثقافة.</p>
              </div>

              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="200">
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                    <path d="M3 21h18" />
                  </svg>
                </div>
                <h3>مساحة إبداعية</h3>
                <p>محرر عربي متكامل يمنح كاتبك أدوات احترافية.</p>
              </div>

              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="300">
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  </svg>
                </div>
                <h3>مجتمع متفاعل</h3>
                <p>تفاعل مع الكتّاب والقرّاء في مجتمع أدبي حيّ.</p>
              </div>

              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="400">
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h3>جودة عالية</h3>
                <p>نصوص منتقاة بعناية وأدوات احترافية للكتابة.</p>
              </div>
            </div>
          </div>

          {/* ===== قسم: رحلتنا بالأرقام ===== */}
          <div className={styles.journeySection} data-aos="fade-up" data-aos-duration="1000">
            <h2 className={styles.sectionTitle}>
              <span>رحلتنا</span>
              <span className={styles.gold}>بالأرقام</span>
            </h2>
            <div className={styles.journeyGrid}>
              <div className={styles.journeyItem} data-aos="zoom-in" data-aos-delay="100">
                <div className={styles.journeyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <span className={styles.journeyNumber}>مكتبة</span>
                <span className={styles.journeyLabel}>متنامية من الروايات</span>
              </div>
              <div className={styles.journeyItem} data-aos="zoom-in" data-aos-delay="200">
                <div className={styles.journeyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                    <path d="M3 21h18" />
                  </svg>
                </div>
                <span className={styles.journeyNumber}>محرر</span>
                <span className={styles.journeyLabel}>عربي غني للكتابة</span>
              </div>
              <div className={styles.journeyItem} data-aos="zoom-in" data-aos-delay="300">
                <div className={styles.journeyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className={styles.journeyNumber}>مجتمع</span>
                <span className={styles.journeyLabel}>أدبي متفاعل</span>
              </div>
              <div className={styles.journeyItem} data-aos="zoom-in" data-aos-delay="400">
                <div className={styles.journeyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <span className={styles.journeyNumber}>تعريب</span>
                <span className={styles.journeyLabel}>أدبي عالي الجودة</span>
              </div>
            </div>
          </div>

          {/* ===== قسم القيم ===== */}
          <div className={styles.valuesSection} data-aos="fade-up" data-aos-duration="1000">
            <h2 className={styles.sectionTitle}>
              <span>قيمنا</span>
            </h2>
            <div className={styles.valuesContainer}>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="100">
                <span className={styles.valueIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
                <h4>الشغف</h4>
              </div>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="200">
                <span className={styles.valueIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </span>
                <h4>الأصالة</h4>
              </div>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="300">
                <span className={styles.valueIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                  </svg>
                </span>
                <h4>الانفتاح</h4>
              </div>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="400">
                <span className={styles.valueIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <h4>المشاركة</h4>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}