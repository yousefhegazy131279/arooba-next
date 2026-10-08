'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import styles from './Contact.module.css';

/* ==========================================================
   🎨 أيقونات SVG
   ========================================================== */
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 7.2 7.6 5.3a1.6 1.6 0 0 0 1.8 0l7.6-5.3" />
  </svg>
);

const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
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

const IconExternal = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* ============ أيقونات السوشيال ============ */
const YoutubeIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>);
const TiktokIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.09z"/></svg>);
const XIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const InstagramIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311 1.266-.058 1.646-.07 4.85-.07zM12 7.47a4.53 4.53 0 1 0 0 9.06 4.53 4.53 0 0 0 0-9.06zm0 7.52a2.99 2.99 0 1 1 0-5.98 2.99 2.99 0 0 1 0 5.98zm5.91-7.9a1.06 1.06 0 1 0 0 2.12 1.06 1.06 0 0 0 0-2.12z"/></svg>);
const FacebookIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>);
const GithubIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>);
const LinkedinIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);

/* ==========================================================
   📞 بيانات التواصل والروابط
   ========================================================== */
const CONTACT_EMAIL = 'yousef.hegazy.dev@gmail.com';
const CONTACT_WHATSAPP = '+201117081077';
const CONTACT_WHATSAPP_LINK = 'https://wa.me/201117081077';

/* ============ روابط المنصة (عُروبة) ============ */
const PLATFORM_LINKS = [
  { brand: 'facebook',  label: 'عُروبة على فيسبوك',  href: 'https://www.facebook.com/arubaharabia',   icon: <FacebookIcon /> },
  { brand: 'instagram', label: 'عُروبة على إنستغرام', href: 'https://www.instagram.com/arubaharabia', icon: <InstagramIcon /> },
  { brand: 'x',         label: 'عُروبة على X',        href: 'https://twitter.com/arubaharabia',       icon: <XIcon /> },
] as const;

/* ============ روابط المطوّر (يوسف حجازي) ============ */
const DEVELOPER_LINKS = [
  { brand: 'youtube',   label: 'YouTube',   href: 'https://www.youtube.com/@YousefHegazydev',              icon: <YoutubeIcon /> },
  { brand: 'tiktok',    label: 'TikTok',    href: 'https://www.tiktok.com/@yousefhegazydev?lang=en',       icon: <TiktokIcon /> },
  { brand: 'x',         label: 'X (تويتر)', href: 'https://x.com/Yousefhegazy00',                         icon: <XIcon /> },
  { brand: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/yousef.hegazy.dev/',         icon: <InstagramIcon /> },
  { brand: 'facebook',  label: 'Facebook',  href: 'https://www.facebook.com/profile.php?id=61594760347792', icon: <FacebookIcon /> },
  { brand: 'github',    label: 'GitHub',    href: 'https://github.com/yousefhegazy131279',                icon: <GithubIcon /> },
  { brand: 'linkedin',  label: 'LinkedIn',  href: 'https://www.linkedin.com/in/yousef-hegazy-a0aa13333',   icon: <LinkedinIcon /> },
] as const;

const PORTFOLIO_URL = 'https://hogz.vercel.app';

/* ==========================================================
   🧩 المكوّن
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
      const { error } = await supabase.from('messages').insert({
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

                <a href={CONTACT_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={styles.infoItem}>
                  <span className={styles.itemIcon}><IconWhatsApp /></span>
                  <div className={styles.itemDetails}>
                    <h4>واتساب</h4>
                    <p>{CONTACT_WHATSAPP}</p>
                  </div>
                </a>
              </div>

              {/* ============ روابط المنصة ============ */}
              <div className={styles.socialSection}>
                <p className={styles.socialTitle}>تابع عُروبة</p>
                <div className={styles.socialIcons}>
                  {PLATFORM_LINKS.map((s) => (
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

              <button type="submit" className={styles.submitBtn} disabled={status === 'sending'}>
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
                      <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: 4, direction: 'ltr', textAlign: 'left' }}>
                        {errorMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* ===== قسم المطوّر (مفصول) ===== */}
        <section className={styles.developerSection} data-aos="fade-up">
          <div className={styles.developerCard}>
            <span className={styles.developerLabel}>المطوّر</span>

            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.hgzLink}
              aria-label="زيارة موقع المطوّر HGZ"
            >
              <span className={styles.hgzText}>HGZ</span>
              <span className={styles.hgzSpark} aria-hidden="true">✦</span>
            </a>

            <h3 className={styles.developerName}>يوسف حجازي</h3>
            <p className={styles.developerRole}>Full-Stack Developer · مطوّر منصة عُروبة</p>

            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.portfolioBtn}
            >
              <span>زيارة البورتفوليو</span>
              <IconExternal />
            </a>

            <div className={styles.socialIcons}>
              {DEVELOPER_LINKS.map((s) => (
                <a
                  key={s.brand + s.label}
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