'use client';

import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import styles from './Contact.module.css';
import { supabase } from '@/lib/supabaseClient';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const contactInfo = [
  { 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ), 
    label: 'البريد الإلكتروني', 
    value: 'arubaharabia@gmail.com' 
  },
  { 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ), 
    label: 'المقر', 
    value: 'الجيزة, مصر' 
  },
  { 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ), 
    label: 'الهاتف', 
    value: '+20 111 708 1077' 
  },
  { 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ), 
    label: 'ساعات العمل', 
    value: 'من الاحد إلى الخميس , 12م-9م' 
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      mirror: true,
    });
    const handleResize = () => AOS.refresh();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatusMsg('جميع الحقول مطلوبة');
      setIsError(true);
      setTimeout(() => setStatusMsg(''), 5000);
      return;
    }

    setLoading(true);
    setStatusMsg('');

    try {
      const { error } = await supabase.from('messages').insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        status: 'unread',
      });

      if (error) throw error;

      setStatusMsg('تم إرسال رسالتك بنجاح! شكراً لتواصلك معنا.');
      setIsError(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg(err.message || 'حدث خطأ أثناء الإرسال. الرجاء المحاولة لاحقاً.');
      setIsError(true);
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  };

  return (
    <div className={styles.contactPage}>
      <div className={styles.pageBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.container}>
        <div className={styles.pageHeader} data-aos="fade-down" data-aos-duration="1000">
          <h1 className={styles.pageTitle}>
            <span className={styles.titleWord} data-aos="fade-left" data-aos-delay="200">تواصل</span>
            <span className={`${styles.titleWord} ${styles.gold}`} data-aos="fade-up" data-aos-delay="300">معنا</span>
          </h1>
          <p className={styles.pageSubtitle} data-aos="fade-up" data-aos-delay="400">
            يسعدنا سماع آرائكم واقتراحاتكم لتطوير مشروع "عُروبة"
          </p>
          <div className={styles.titleDecoration} data-aos="zoom-in" data-aos-delay="500">
            <span className={styles.decorationLine}></span>
            <span className={styles.decorationStar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span className={styles.decorationLine}></span>
          </div>
        </div>

        <div className={styles.contactContent}>
          <div className={styles.contactInfo} data-aos="fade-left" data-aos-duration="1200" data-aos-delay="200">
            <div className={styles.infoCard}>
              <h2 className={styles.infoTitle}>معلومات الاتصال</h2>
              <div className={styles.infoItems}>
                {contactInfo.map((item, idx) => (
                  <div key={idx} className={styles.infoItem}>
                    <div className={styles.itemIcon}>{item.icon}</div>
                    <div className={styles.itemDetails}>
                      <h4>{item.label}</h4>
                      <p>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.socialSection}>
                <h3 className={styles.socialTitle}>تابعنا على</h3>
                <div className={styles.socialIcons}>
                  <a href="https://www.facebook.com/arubaharabia" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 5 3.657 9.128 8.438 9.878v-6.988h-2.54v-2.89h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.462h-1.26c-1.242 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 17 22 12z" />
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/arubaharabia" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M7.75 2h8.5C19.097 2 21 3.903 21 6.25v11.5C21 20.097 19.097 22 16.25 22h-8.5C4.903 22 3 20.097 3 17.75V6.25C3 3.903 4.903 2 7.75 2zm0 1.5C5.955 3.5 4.5 4.955 4.5 6.75v10.5c0 1.795 1.455 3.25 3.25 3.25h8.5c1.795 0 3.25-1.455 3.25-3.25V6.75c0-1.795-1.455-3.25-3.25-3.25h-8.5zm4.25 3.25a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm4.75-.75a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className={styles.mapPreview}>
                <img src="/map-preview.png" alt="موقعنا" />
              </div>
            </div>
          </div>

          <div className={styles.contactForm} data-aos="fade-right" data-aos-duration="1200" data-aos-delay="300">
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>أرسل لنا رسالة</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">الاسم الكامل</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسمك"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">البريد الإلكتروني</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@domain.com"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="subject">عنوان الرسالة</label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="مثلاً: استفسار عن رواية"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="message">الرسالة</label>
                  <textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="اكتب تفاصيل رسالتك هنا..."
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className={styles.submitBtn}>
                  {!loading ? 'إرسال الرسالة' : <span className={styles.loadingSpinner}></span>}
                </button>

                {statusMsg && (
                  <div className={`${styles.statusMessage} ${isError ? styles.error : styles.success}`}>
                    <span className={styles.statusIcon}>
                      {isError ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <p>{statusMsg}</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className={styles.trustSection} data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400">
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <div>
              <h4>رد سريع</h4>
              <p>نحن نرد على جميع الاستفسارات خلال 24 ساعة</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div>
              <h4>خصوصية تامة</h4>
              <p>معلوماتك آمنة ومشفرة</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <div>
              <h4>دعم مستمر</h4>
              <p>فريقنا جاهز لمساعدتك دائماً</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}