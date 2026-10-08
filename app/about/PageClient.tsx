'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import AOS from 'aos';
import 'aos/dist/aos.css';
import styles from './about.module.css';

/* ==========================================================
   🎨 أيقونات SVG
   ========================================================== */
const BookIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const PenIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const HeartIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.5 4 5.5v6c0 4.7 3.2 8.8 8 10 4.8-1.2 8-5.3 8-10v-6L12 2.5Z" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M19 17l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7L19 17z" />
  </svg>
);

const TargetIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const RocketIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const CompassIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const PaletteIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const QuoteIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9.5 4C6.46 4 4 6.46 4 9.5c0 2.71 1.9 4.97 4.45 5.42-.58 1.93-1.97 3.39-3.72 4.08-.32.13-.53.45-.53.79 0 .46.42.8.86.68 3.98-1.07 6.94-4.67 6.94-8.97v-2C12 6.46 11.04 4 9.5 4zm9 0C15.46 4 13 6.46 13 9.5c0 2.71 1.9 4.97 4.45 5.42-.58 1.93-1.97 3.39-3.72 4.08-.32.13-.53.45-.53.79 0 .46.42.8.86.68 3.98-1.07 6.94-4.67 6.94-8.97v-2C21 6.46 20.04 4 18.5 4z" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* ==========================================================
   🧩 المكوّن
   ========================================================== */
export default function PageClient() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
  }, []);

  return (
    <main className={styles.aboutPage} dir="rtl">
      {/* ========== قسم البطل ========== */}
      <section className={styles.aboutHero}>
        <div className={styles.heroBackground} aria-hidden="true">
          <div className={`${styles.gradientOrb} ${styles.orb1}`} />
          <div className={`${styles.gradientOrb} ${styles.orb2}`} />
          <div className={`${styles.gradientOrb} ${styles.orb3}`} />
          <div className={styles.gridOverlay} />
        </div>

        <div className={styles.floatingShapes} aria-hidden="true">
          <span className={`${styles.shape} ${styles.shape1}`}>✦</span>
          <span className={`${styles.shape} ${styles.shape2}`}>◆</span>
          <span className={`${styles.shape} ${styles.shape3}`}>✧</span>
          <span className={`${styles.shape} ${styles.shape4}`}>◇</span>
        </div>

        <div className={styles.heroContent} data-aos="fade-down">
          <span className={styles.heroBadge}>حكايتنا مع الحكايات</span>
          <h1 className={styles.heroTitle}>
            <span className={styles.titleWord}>عن</span>
            <span className={`${styles.titleWord} ${styles.gold}`}>عُروبة</span>
          </h1>
          <p className={styles.heroSubtitle}>
            منصة أدبية عربية وُلدت من شغفٍ بالحكاية، وآمنت أنّ اللغة العربية تستحقّ فضاءً
            يليق بها: للقراءة، للكتابة، للتعريب، وللمجتمع الذي يجمعهم.
          </p>
          <div className={styles.heroDecoration}>
            <span className={styles.decorationLine} />
            <span className={styles.decorationStar}><SparklesIcon /></span>
            <span className={styles.decorationLine} />
          </div>
        </div>
      </section>

      {/* ========== المحتوى ========== */}
      <section className={styles.contentSection}>
        <div className={styles.container}>
          {/* ===== قسم المؤسس ===== */}
          <div className={styles.founderSection} data-aos="fade-up">
            <div className={styles.founderImageWrapper}>
              <div className={styles.imageGlow} aria-hidden="true" />
              <div className={styles.imageFrame} aria-hidden="true" />
              <img src="/founder.png" alt="مؤسس عُروبة" className={styles.founderImage} />
            </div>
            <blockquote className={styles.founderQuote}>
              <span className={styles.quoteIcon} aria-hidden="true"><QuoteIcon /></span>
              «لم أرد أن أُطلق منصة أخرى، بل بيتاً للحكاية العربية.
              بيتٌ يجد فيه القارئ مأواه، والكاتب منبره، والمترجم فضاءه.»
              <span className={styles.quoteAuthor}>— مؤسس عُروبة</span>
            </blockquote>
          </div>

          {/* ===== الرؤية والرسالة ===== */}
          <div className={styles.aboutGrid}>
            <div className={styles.aboutCard} data-aos="fade-left">
              <h2 className={styles.goldenText}><TargetIcon /> رؤيتنا</h2>
              <p>
                أن تكون <strong>عُروبة</strong> المنصة الأدبية العربية الأولى التي
                يحتضن فيها القارئ حكايته، ويجد الكاتب مساحته، ويجد المترجم منبره؛
                فضاءً يجمع الأصالة والمعاصرة، والورق والتقنية.
              </p>
              <div className={styles.visionStats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>+5</span>
                  <span className={styles.statLabel}>آلاف الحكايات</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>24/7</span>
                  <span className={styles.statLabel}>متاحون دائماً</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>∞</span>
                  <span className={styles.statLabel}>إمكانات بلا حدود</span>
                </div>
              </div>
            </div>

            <div className={styles.aboutCard} data-aos="fade-right">
              <h2 className={styles.goldenText}><RocketIcon /> رسالتنا</h2>
              <p>
                نُهيّئ لغةً حيّةً للحكاية: نُعرب الأدب العالمي بجمالية، نمكّن الكتّاب
                العرب من أدوات حديثة، ونبني مجتمعاً تفاعلياً يُقدّر الكلمة ويحتفل
                بالحكاية.
              </p>
              <p>
                نؤمن أنّ <strong>الكلمة الطيبة صدقة</strong>، وأنّ الحكايات جسورٌ
                تعبر بها الروح إلى الآخرين.
              </p>
            </div>
          </div>

          {/* ===== الركائز ===== */}
          <section className={styles.pillarsSection}>
            <h2 className={styles.sectionTitle} data-aos="fade-up">
              <span>أربع</span> <span className={styles.gold}>ركائز</span>
            </h2>
            <p className={styles.sectionSubtitle} data-aos="fade-up">
              كل ما نبنيه يقوم على هذه الأسس.
            </p>
            <div className={styles.pillarsGrid}>
              <div className={styles.pillarCard} data-aos="fade-up" data-aos-delay="0">
                <div className={styles.pillarIcon}><BookIcon /></div>
                <h3>قراءة</h3>
                <p>مكتبة من الروايات المعرّبة بأسلوب أدبي رصين.</p>
              </div>
              <div className={styles.pillarCard} data-aos="fade-up" data-aos-delay="100">
                <div className={styles.pillarIcon}><PenIcon /></div>
                <h3>كتابة</h3>
                <p>مساحة كتابة بمحرر عربي غني، تنقلك من الفكرة إلى المنشور.</p>
              </div>
              <div className={styles.pillarCard} data-aos="fade-up" data-aos-delay="200">
                <div className={styles.pillarIcon}><GlobeIcon /></div>
                <h3>تعريب</h3>
                <p>نقل الأدب العالمي إلى العربية بروحٍ أدبية أصيلة.</p>
              </div>
              <div className={styles.pillarCard} data-aos="fade-up" data-aos-delay="300">
                <div className={styles.pillarIcon}><UsersIcon /></div>
                <h3>مجتمع</h3>
                <p>فضاء تفاعلي يجمع القرّاء والكتّاب والمترجمين.</p>
              </div>
            </div>
          </section>

          {/* ===== ما نقدمه ===== */}
          <section className={styles.missionSection}>
            <h2 className={styles.sectionTitle} data-aos="fade-up">
              <span>ماذا</span> <span className={styles.gold}>نقدّم</span>
            </h2>
            <p className={styles.sectionSubtitle} data-aos="fade-up">
              أدواتٌ وتجارب صُمّمت بعناية لخدمة الحكاية العربية.
            </p>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard} data-aos="fade-up" data-aos-delay="0">
                <div className={styles.featureIcon}><BookIcon /></div>
                <h3>قارئ تفاعلي</h3>
                <p>تجربة قراءة بتقنية الكتاب الورقي، مع تظليل وحفظ تلقائي.</p>
              </div>
              <div className={styles.featureCard} data-aos="fade-up" data-aos-delay="100">
                <div className={styles.featureIcon}><PaletteIcon /></div>
                <h3>مظهر أنيق</h3>
                <p>وضع فاتح وداكن، وتصميم يحترم العين والكلمة.</p>
              </div>
              <div className={styles.featureCard} data-aos="fade-up" data-aos-delay="200">
                <div className={styles.featureIcon}><ShieldIcon /></div>
                <h3>أمان وخصوصية</h3>
                <p>بياناتك محفوظة وسياسات وصول محكمة لكل جزء.</p>
              </div>
              <div className={styles.featureCard} data-aos="fade-up" data-aos-delay="300">
                <div className={styles.featureIcon}><HeartIcon /></div>
                <h3>مجتمع حيّ</h3>
                <p>منشورات، رسائل، إشعارات، ومتابعة بين الأعضاء.</p>
              </div>
            </div>
          </section>

          {/* ===== رحلتنا ===== */}
          <section className={styles.journeySection}>
            <h2 className={styles.sectionTitle} data-aos="fade-up">
              <span>رحلتنا</span> <span className={styles.gold}>في أرقام</span>
            </h2>
            <p className={styles.sectionSubtitle} data-aos="fade-up">
              محطاتٌ نفخر بها في بناء عُروبة.
            </p>
            <div className={styles.journeyGrid}>
              <div className={styles.journeyItem} data-aos="fade-up" data-aos-delay="0">
                <div className={styles.journeyIcon}><CompassIcon /></div>
                <span className={styles.journeyNumber}>2026</span>
                <span className={styles.journeyLabel}>سنة التأسيس</span>
              </div>
              <div className={styles.journeyItem} data-aos="fade-up" data-aos-delay="100">
                <div className={styles.journeyIcon}><BookIcon /></div>
                <span className={styles.journeyNumber}>3.0</span>
                <span className={styles.journeyLabel}>الإصدار الحالي</span>
              </div>
              <div className={styles.journeyItem} data-aos="fade-up" data-aos-delay="200">
                <div className={styles.journeyIcon}><SparklesIcon /></div>
                <span className={styles.journeyNumber}>98%</span>
                <span className={styles.journeyLabel}>نسبة الاكتمال</span>
              </div>
              <div className={styles.journeyItem} data-aos="fade-up" data-aos-delay="300">
                <div className={styles.journeyIcon}><HeartIcon /></div>
                <span className={styles.journeyNumber}>∞</span>
                <span className={styles.journeyLabel}>شغفٌ بالحكاية</span>
              </div>
            </div>
          </section>

          {/* ===== قيمنا ===== */}
          <section className={styles.valuesSection}>
            <h2 className={styles.sectionTitle} data-aos="fade-up">
              <span>قيمنا</span> <span className={styles.gold}>في كلمات</span>
            </h2>
            <div className={styles.valuesContainer} data-aos="fade-up">
              <div className={styles.valueItem}>
                <div className={styles.valueIcon}><BookIcon /></div>
                <h4>الأصالة</h4>
              </div>
              <div className={styles.valueItem}>
                <div className={styles.valueIcon}><HeartIcon /></div>
                <h4>الشغف</h4>
              </div>
              <div className={styles.valueItem}>
                <div className={styles.valueIcon}><ShieldIcon /></div>
                <h4>الاحترام</h4>
              </div>
              <div className={styles.valueItem}>
                <div className={styles.valueIcon}><SparklesIcon /></div>
                <h4>الإبداع</h4>
              </div>
              <div className={styles.valueItem}>
                <div className={styles.valueIcon}><UsersIcon /></div>
                <h4>المجتمع</h4>
              </div>
            </div>
          </section>

          {/* ========== قسم المطوّر (جديد) ========== */}
          <section className={styles.developerSection} data-aos="fade-up" aria-labelledby="dev-title">
            <div className={styles.developerCard}>
              <span className={styles.developerBadge}>المطوّر</span>

              <a
                href="https://hogz.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.developerHgz}
                aria-label="زيارة موقع المطوّر HGZ"
              >
                <span className={styles.developerHgzText}>HGZ</span>
                <span className={styles.developerHgzSpark} aria-hidden="true">✦</span>
              </a>

              <h3 id="dev-title" className={styles.developerName}>يوسف حجازي</h3>
              <p className={styles.developerRole}>Full-Stack Developer · مطوّر منصة عُروبة</p>
              <p className={styles.developerBio}>
                بنى عُروبة من الصفر: تصميم، تطوير، قاعدة بيانات، ونشر.
                شغوف بالويب الحديث، الأدب العربي، وتجربة المستخدم.
              </p>

              <a
                href="https://hogz.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.portfolioBtn}
              >
                <span>زيارة البورتفوليو</span>
                <ExternalIcon />
              </a>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}