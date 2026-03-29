// app/ClientProvider.tsx
'use client';

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // تأخير تهيئة AOS لضمان اكتمال الـ hydration
    const timer = setTimeout(() => {
      AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: false,
        mirror: true,
        offset: 50,
        delay: 0,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}