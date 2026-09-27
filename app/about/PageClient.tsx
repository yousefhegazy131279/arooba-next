'use client';

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
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

      {/* قسم البطل (Hero) */}
      <header className={styles.aboutHero}>
        <div className={styles.heroBackground}>
          <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
          <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
          <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
          <div className={styles.gridOverlay}></div>
        </div>

        <div className={styles.container}>
          <div className={styles.heroContent} data-aos="fade-up" data-aos-duration="1200">
            <h1 className={styles.heroTitle}>
              <span className={styles.titleWord}>عن</span>
              <span className={`${styles.titleWord} ${styles.gold}`}>عُروبة</span>
            </h1>
            <p className={styles.heroSubtitle}>جسرك العربي إلى الأدب العالمي</p>
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
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape3}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape4}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        </div>
      </header>

      {/* قسم المحتوى الرئيسي */}
      <section className={styles.contentSection}>
        <div className={styles.container}>
          {/* صورة المؤسس والنبذة الشخصية */}
          <div className={styles.founderSection} data-aos="fade-up" data-aos-duration="1000">
            <div className={styles.founderImageWrapper}>
              <img src="/founder.png" alt="مؤسس عُروبة" className={styles.founderImage} />
              <div className={styles.imageGlow}></div>
              <div className={styles.imageFrame}></div>
            </div>
            <div className={styles.founderQuote}>
              <span className={styles.quoteIcon}>❝</span>
              <p>مؤمن بأن الأدب العربي من أجمل ما كُتب، وأن لغتنا قادرة على حمل أعظم الحكايات.</p>
              <span className={styles.quoteAuthor}>- يوسف حجازي</span>
            </div>
          </div>

          {/* شبكة البطاقات (حكايتنا + رؤيتنا) */}
          <div className={styles.aboutGrid}>
            <div className={styles.aboutCard} data-aos="fade-left" data-aos-delay="200">
              <h2 className={styles.goldenText}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginLeft: '8px' }}>
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                حكايتنا
              </h2>
              <p>
                أنا مؤمن بأن الأدب العربي من أجمل ما كُتب في تاريخ اللغات، وأن اللغة العربية قادرة على حمل أعظم الحكايات
                وأعمق المشاعر. ومن هنا وُلدت فكرة عُروبة.
              </p>
              <p>
                أنشأت هذا المشروع لأنني لاحظت أن كثيرًا من القرّاء العرب لا يستطيعون الوصول إلى العديد من الروايات
                والقصص العالمية بسبب حاجز اللغة، فبقيت أعمال أدبية عظيمة بعيدة عنهم. لذلك جاءت عُروبة محاولةً لتقريب تلك
                الحكايات إلى القارئ العربي، عبر تعريبها وصياغتها بأسلوب عربي فصيح يحافظ على روح القصة الأصلية ويجعلها
                تبدو وكأنها كُتبت بالعربية منذ البداية.
              </p>
              <p>
                لا يهدف هذا المشروع إلى مجرد نقل القصص من لغة إلى أخرى، بل إلى تقديمها بروحٍ أدبية عربية أصيلة، بحيث
                يستطيع القارئ العربي الاستمتاع بأجمل الروايات العالمية بلغته الأم.
              </p>
            </div>

            <div className={`${styles.aboutCard} ${styles.highlight}`} data-aos="fade-right" data-aos-delay="300">
              <h2 className={styles.goldenText}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginLeft: '8px' }}>
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
                  <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" />
                </svg>
                رؤيتنا
              </h2>
              <p>
                رؤيتي أن تتوسع عُروبة يومًا بعد يوم لتشمل أكبر قدر ممكن من الأعمال القصصية العالمية، وأن تصل هذه
                الحكايات إلى كل بيت عربي. فالأدب ليس مجرد وسيلة للمتعة، بل هو أيضًا طريق لنشر الثقافة، وإحياء الشغف
                بالقراءة، وإيصال قصص تستحق أن تُروى.
              </p>
              <div className={styles.visionStats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>50+</span>
                  <span className={styles.statLabel}>رواية مُعربة</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>1000+</span>
                  <span className={styles.statLabel}>قارئ</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>20+</span>
                  <span className={styles.statLabel}>عمل أصلي</span>
                </div>
              </div>
            </div>
          </div>

          {/* قسم الميزات / لماذا عُروبة؟ */}
          <div className={styles.missionSection} data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400">
            <h2 className={styles.sectionTitle}>
              <span>لماذا</span> <span className={styles.gold}>عُروبة</span>
              <span>؟</span>
            </h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="500">
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3>تعريب فني</h3>
                <p>لا نترجم الكلمات، بل ننقل الأحاسيس والثقافة.</p>
              </div>
              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="600">
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <h3>انتقاء خاص</h3>
                <p>نختار القصص التي تركت بصمة في التاريخ البشري.</p>
              </div>
              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="700">
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3>تفاعلية</h3>
                <p>الجمهور هو من يوجهنا لما يحب قراءته.</p>
              </div>
              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="800">
                <div className={styles.featureIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h3>جودة عالية</h3>
                <p>نخبة من المترجمين لضمان أفضل نص عربي.</p>
              </div>
            </div>
          </div>

          {/* قسم القيم */}
          <div className={styles.valuesSection} data-aos="fade-up" data-aos-duration="1000" data-aos-delay="900">
            <h2 className={styles.sectionTitle}>
              <span>قيمنا</span>
            </h2>
            <div className={styles.valuesContainer}>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="1000">
                <span className={styles.valueIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
                <h4>الشغف</h4>
              </div>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="1100">
                <span className={styles.valueIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </span>
                <h4>الأصالة</h4>
              </div>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="1200">
                <span className={styles.valueIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                  </svg>
                </span>
                <h4>الانفتاح</h4>
              </div>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="1300">
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