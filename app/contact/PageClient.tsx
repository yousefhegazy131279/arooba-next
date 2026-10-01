'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import styles from './Contact.module.css';

/* ==========================================================
   🎨 أيقونات SVG فخمة
   ========================================================== */
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 7.2 7.6 5.3a1.6 1.6 0 0 0 1.8 0l7.6-5.3" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21.5 16.9v2.6a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7 18.8 18.8 0 0 1-2.9-8.3A1.9 1.9 0 0 1 4.5 2.5h2.6a1.9 1.9 0 0 1 1.9 1.6 12.2 12.2 0 0 0 .7 2.7 1.9 1.9 0 0 1-.4 2L8 10.1a15.2 15.2 0 0 0 5.7 5.7l1.3-1.3a1.9 1.9 0 0 1 2-.4 12.2 12.2 0 0 0 2.7.7 1.9 1.9 0 0 1 1.6 2Z" />
  </svg>
);

const IconSparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.5c.4 3.5 1.4 5.5 3.4 6.9 1.5 1 3 1.4 6.1 1.6-3.1.2-4.6.6-6.1 1.6-2 1.4-3 3.4-3.4 6.9-.4-3.5-1.4-5.5-3.4-6.9-1.5-1-3-1.4-6.1-1.6 3.1-.2 4.6-.6 6.1-1.6 2-1.4 3-3.4 3.4-6.9Z" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" opacity="0.35" />
    <path d="m7.5 12.2 3.2 3.2 5.8-6" />
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.3 3.6 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 2 4.5 13.5h6.5L11 22l8.5-11.5H13L13 2Z" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.5 4 5.5v6c0 4.7 3.2 8.8 8 10 4.8-1.2 8-5.3 8-10v-6L12 2.5Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.7-.8L3 21l1.8-5.8a8.5 8.5 0 0 1-.8-3.7A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" />
    <path d="M8.5 11.5h.01" />
    <path d="M12 11.5h.01" />
    <path d="M15.5 11.5h.01" />
  </svg>
);

/* ==========================================================
   📞 بيانات التواصل — حدّثها من هنا فقط
   ========================================================== */
const CONTACT_EMAIL = 'yousef.hegazy.dev@gmail.com';
const CONTACT_PHONE = '+201117081077';

const SOCIAL_LINKS = [
  {
    brand: 'twitter',
    label: 'X (تويتر)',
    href: 'https://twitter.com/arooba',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    brand: 'instagram',
    label: 'إنستغرام',
    href: 'https://instagram.com/arooba',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    brand: 'facebook',
    label: 'فيسبوك',
    href: 'https://facebook.com/arooba',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    brand: 'youtube',
    label: 'يوتيوب',
    href: 'https://youtube.com/@arooba',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
] as const;

/* ==========================================================
   🧩 المكوّن الرئيسي
   ========================================================== */
export default function PageClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;

    // تحقق أساسي قبل الإرسال
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
      setStatus('error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          status: 'unread',
        });

      if (error) {
        console.error('[contact] supabase error:', error);
        setErrorMsg(error.message || 'تعذر الاتصال بالخدمة.');
        setStatus('error');
        return;
      }

      // نجاح
      setStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
      console.error('[contact] exception:', msg);
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  return (
    <main className={styles.contactPage} dir="rtl">
      {/* ===== الخلفية المتحركة ===== */}
      <div className={styles.pageBackground} aria-hidden="true">
        <div className={`${styles.gradientOrb} ${styles.orb1}`} />
        <div className={`${styles.gradientOrb} ${styles.orb2}`} />
        <div className={`${styles.gradientOrb} ${styles.orb3}`} />
        <div className={styles.gridOverlay} />
      </div>

      <div className={styles.container}>
        {/* ===== الترويسة ===== */}
        <header className={styles.pageHeader} data-aos="fade-down">
          <span className={styles.availabilityBadge}>متاحون دائماً للرد عليك</span>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleWord}>تواصل</span>
            <span className={`${styles.titleWord} ${styles.gold}`}>معنا</span>
          </h1>
          <p className={styles.pageSubtitle}>
            لديك سؤال، اقتراح، أو ترغب في التعاون معنا؟ نحن هنا لنسمعك. راسلنا وسنعود إليك في أقرب وقت.
          </p>
          <div className={styles.titleDecoration}>
            <span className={styles.decorationLine} />
            <span className={styles.decorationStar}><IconSparkle /></span>
            <span className={styles.decorationLine} />
          </div>
        </header>

        {/* ===== المحتوى ===== */}
        <section className={styles.contactContent}>
          {/* بطاقة المعلومات */}
          <div className={styles.contactInfo} data-aos="fade-left">
            <div className={styles.infoCard}>
              <h2 className={styles.infoTitle}>معلومات التواصل</h2>

              <div className={styles.infoItems}>
                <a href={`mailto:${CONTACT_EMAIL}`} className={styles.infoItem}>
                  <span className={styles.itemIcon}><IconMail /></span>
                  <div className={styles.itemDetails}>
                    <h4>البريد الإلكتروني</h4>
                    <p>{CONTACT_EMAIL}</p>
                  </div>
                </a>

                <a href={`tel:${CONTACT_PHONE}`} className={styles.infoItem}>
                  <span className={styles.itemIcon}><IconPhone /></span>
                  <div className={styles.itemDetails}>
                    <h4>الهاتف</h4>
                    <p>{CONTACT_PHONE}</p>
                  </div>
                </a>
              </div>

              {/* ===== السوشيال ===== */}
              <div className={styles.socialSection}>
                <p className={styles.socialTitle}>تابعنا على</p>
                <div className={styles.socialIcons}>
                  {SOCIAL_LINKS.map((s) => (
                    <a
                      key={s.brand}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialIcon}
                      data-brand={s.brand}
                      data-label={s.label}
                      aria-label={s.label}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* بطاقة النموذج */}
          <div className={styles.contactForm} data-aos="fade-right">
            <form className={styles.formCard} onSubmit={handleSubmit}>
              <h2 className={styles.formTitle}>أرسل رسالتك</h2>

              <div className={styles.formGroup}>
                <label htmlFor="ct-name">الاسم</label>
                <input
                  id="ct-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمك الكريم"
                  required
                  maxLength={120}
                  disabled={status === 'sending'}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ct-email">البريد الإلكتروني</label>
                <input
                  id="ct-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  dir="ltr"
                  disabled={status === 'sending'}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ct-subject">الموضوع</label>
                <input
                  id="ct-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="عن ماذا تريد أن تتحدث؟"
                  required
                  maxLength={180}
                  disabled={status === 'sending'}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ct-message">الرسالة</label>
                <textarea
                  id="ct-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا…"
                  required
                  rows={6}
                  maxLength={4000}
                  disabled={status === 'sending'}
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? (
                  <>
                    <span className={styles.loadingSpinner} />
                    جارٍ الإرسال…
                  </>
                ) : (
                  <>
                    <IconSend />
                    أرسل الرسالة
                  </>
                )}
              </button>

              {status === 'success' && (
                <div className={`${styles.statusMessage} ${styles.success}`} role="status">
                  <span className={styles.statusIcon}><IconCheck /></span>
                  وصلتنا رسالتك بنجاح — سنعود إليك قريباً.
                </div>
              )}

              {status === 'error' && (
                <div className={`${styles.statusMessage} ${styles.error}`} role="alert">
                  <span className={styles.statusIcon}><IconAlert /></span>
                  <div>
                    <div>تعذر الإرسال. حاول مرة أخرى أو راسلنا مباشرة على البريد.</div>
                    {errorMsg && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          opacity: 0.75,
                          marginTop: 4,
                          direction: 'ltr',
                          textAlign: 'left',
                        }}
                      >
                        {errorMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* ===== قسم الثقة ===== */}
        <section className={styles.trustSection} data-aos="fade-up">
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}><IconBolt /></div>
            <h4>ردّ سريع</h4>
            <p>نجيب على معظم الرسائل خلال ٢٤ إلى ٤٨ ساعة.</p>
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}><IconShield /></div>
            <h4>خصوصية تامة</h4>
            <p>بياناتك محفوظة ولن تُشارك مع أي طرف خارجي.</p>
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}><IconChat /></div>
            <h4>دعم بالعربية</h4>
            <p>فريق كامل يتحدث لغتك ويفهم احتياجاتك الأدبية.</p>
          </div>
        </section>
      </div>
    </main>
  );
}