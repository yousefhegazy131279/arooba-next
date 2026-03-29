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
              <span className={styles.decorationStar}>✨</span>
              <span className={styles.decorationLine}></span>
            </div>
          </div>
        </div>

        <div className={styles.floatingShapes}>
          <span className={`${styles.shape} ${styles.shape1}`}>📚</span>
          <span className={`${styles.shape} ${styles.shape2}`}>🌍</span>
          <span className={`${styles.shape} ${styles.shape3}`}>✍️</span>
          <span className={`${styles.shape} ${styles.shape4}`}>💫</span>
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
              <h2 className={styles.goldenText}>📖 حكايتنا</h2>
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
              <h2 className={styles.goldenText}>🔮 رؤيتنا</h2>
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
                <div className={styles.featureIcon}>📜</div>
                <h3>تعريب فني</h3>
                <p>لا نترجم الكلمات، بل ننقل الأحاسيس والثقافة.</p>
              </div>
              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="600">
                <div className={styles.featureIcon}>💎</div>
                <h3>انتقاء خاص</h3>
                <p>نختار القصص التي تركت بصمة في التاريخ البشري.</p>
              </div>
              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="700">
                <div className={styles.featureIcon}>🤝</div>
                <h3>تفاعلية</h3>
                <p>الجمهور هو من يوجهنا لما يحب قراءته.</p>
              </div>
              <div className={styles.featureCard} data-aos="zoom-in" data-aos-delay="800">
                <div className={styles.featureIcon}>🌟</div>
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
                <span className={styles.valueIcon}>❤️</span>
                <h4>الشغف</h4>
              </div>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="1100">
                <span className={styles.valueIcon}>📖</span>
                <h4>الأصالة</h4>
              </div>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="1200">
                <span className={styles.valueIcon}>🌍</span>
                <h4>الانفتاح</h4>
              </div>
              <div className={styles.valueItem} data-aos="flip-left" data-aos-delay="1300">
                <span className={styles.valueIcon}>🤲</span>
                <h4>المشاركة</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}