'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuthStore } from '@/app/stores/useAuthStore';
import styles from './Register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoggedIn } = useAuthStore();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    const result = await register(username, fullName, email, password);
    setLoading(false);
    if (!result.success) {
      // إذا كان الخطأ يحتوي على "rate limit" نعطي رسالة واضحة
      if (result.error?.includes('rate limit')) {
        setError('لقد تجاوزت عدد المحاولات المسموح بها. يرجى الانتظار دقيقة ثم المحاولة باستخدام بريد إلكتروني جديد.');
      } else {
        setError(result.error || 'فشل التسجيل');
      }
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.animatedBg}>
        <div className={styles.bgGlow}></div>
        <div className={styles.bgParticles}>
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className={styles.particle}></span>
          ))}
        </div>
      </div>

      <div className={styles.registerContainer}>
        <div className={styles.registerCard} data-aos="fade-up" data-aos-duration="800">
          <div className={styles.logoWrapper} data-aos="zoom-in" data-aos-duration="600" data-aos-delay="200">
            <img src="/logo.png" alt="عُروبة" className={styles.logo} />
          </div>

          <h2 data-aos="fade-left" data-aos-delay="300">إنشاء حساب جديد</h2>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorMessage} data-aos="fade-in">
                {error}
              </div>
            )}

            <div className={styles.formGroup} data-aos="fade-left" data-aos-delay="400">
              <label htmlFor="username">اسم المستخدم (للظهور)</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>

            <div className={styles.formGroup} data-aos="fade-left" data-aos-delay="500">
              <label htmlFor="fullName">الاسم الكامل (اختياري)</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم الكامل"
              />
            </div>

            <div className={styles.formGroup} data-aos="fade-left" data-aos-delay="600">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                required
              />
            </div>

            <div className={styles.formGroup} data-aos="fade-left" data-aos-delay="700">
              <label htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
              data-aos="zoom-in"
              data-aos-delay="800"
            >
              {loading ? <span className={styles.spinner}></span> : <span>تسجيل</span>}
            </button>

            <p className={styles.switchLink} data-aos="fade-up" data-aos-delay="900">
              لديك حساب بالفعل؟ <Link href="/login">سجل دخول</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}