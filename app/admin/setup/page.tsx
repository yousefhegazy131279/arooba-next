// app/admin/setup/page.tsx (ملف مؤقت، احذفه بعد التنفيذ)
'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SetupPage() {
  useEffect(() => {
    const createAdmin = async () => {
      const { data, error } = await supabase.auth.signUp({
        email: 'firstboy2025@gmail.com',
        password: 'Hg0181227579',
        options: {
          data: {
            username: 'firstboy',
            full_name: 'First Boy',
          },
        },
      });
      if (error) console.error('Error creating admin:', error);
      else console.log('Admin created:', data);
    };
    createAdmin();
  }, []);
  return <div>جاري إنشاء حساب المدير...</div>;
}