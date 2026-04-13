import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true, // الوضع الافتراضي داكن
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      setDark: (dark) => set({ isDark: dark }),
    }),
    { name: 'theme-storage' }
  )
);

// تطبيق الثيم على عنصر <html> فوراً ومتابعة التغييرات
if (typeof window !== 'undefined') {
  const applyTheme = (isDark: boolean) => {
    if (!isDark) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  // التطبيق الأولي
  applyTheme(useThemeStore.getState().isDark);

  // الاشتراك في أي تغيير لاحق
  useThemeStore.subscribe((state) => applyTheme(state.isDark));
}