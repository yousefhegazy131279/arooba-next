'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuthStore } from '@/app/stores/useAuthStore'; // عدل المسار حسب موقعك
import styles from './Login.module.css';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirectTo') || '/';
  const redirectTo = decodeURIComponent(rawRedirect);

  const { login, isLoggedIn } = useAuthStore();
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
      router.push(redirectTo);
    }
  }, [isLoggedIn, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'فشل تسجيل الدخول');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.animatedBg}>
        <div className={styles.bgGlow}></div>
        <div className={styles.bgParticles}>
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className={styles.particle}></span>
          ))}
        </div>
      </div>

      <div className={styles.loginContainer}>
        <div className={styles.loginCard} data-aos="fade-up" data-aos-duration="800">
          <div className={styles.logoWrapper} data-aos="zoom-in" data-aos-duration="600" data-aos-delay="200">
            <img src="/logo.png" alt="عُروبة" className={styles.logo} />
          </div>

          <h2 data-aos="fade-left" data-aos-delay="300">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorMessage} data-aos="fade-in">
                {error}
              </div>
            )}

            {rawRedirect !== '/' && (
              <div className={styles.infoMessage} data-aos="fade-up">
                يرجى تسجيل الدخول للوصول إلى الصفحة المطلوبة.
              </div>
            )}

            <div className={styles.formGroup} data-aos="fade-left" data-aos-delay="400">
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

            <div className={styles.formGroup} data-aos="fade-left" data-aos-delay="500">
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
              data-aos-delay="600"
            >
              {loading ? <span className={styles.spinner}></span> : <span>دخول</span>}
            </button>

            <p className={styles.switchLink} data-aos="fade-up" data-aos-delay="700">
              ليس لديك حساب؟ <Link href="/register">إنشاء حساب</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}