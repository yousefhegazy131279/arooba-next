// app/stores/useAuthStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role: string;
  community_role?: 'reader' | 'writer' | null;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, full_name: string, email: string, password: string, redirectTo?: string) => Promise<{ success: boolean; requiresConfirmation?: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
    (set) => ({
      user: null,
      loading: true,
      isLoggedIn: false,
      isAdmin: false,

      setUser: (user) => {
        set({
          user,
          isLoggedIn: !!user,
          isAdmin: user?.role === 'admin',
          loading: false,
        });
      },

      login: async (email, password) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
          if (error) throw error;

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, full_name, role, avatar_url, community_role')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile fetch error:', profileError);
          }

          const userData: User = {
            id: data.user.id,
            email: data.user.email!,
            username: profile?.username || '',
            full_name: profile?.full_name || '',
            role: profile?.role || 'user',
            avatar: profile?.avatar_url,
            community_role: profile?.community_role,
          };
          set({
            user: userData,
            isLoggedIn: true,
            isAdmin: userData.role === 'admin',
            loading: false,
          });
          
          return { success: true };
        } catch (err: unknown) {
          console.error('Login error:', err);
          set({ user: null, isLoggedIn: false, isAdmin: false, loading: false });
          const message = err instanceof Error ? err.message : '';
          return { success: false, error: /email not confirmed/i.test(message) ? 'لم تؤكد بريدك الإلكتروني بعد. افتح رسالة التأكيد في بريدك ثم حاول مجددًا.' : /invalid login credentials/i.test(message) ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : message || 'تعذر تسجيل الدخول' };
        }
      },

      register: async (username, full_name, email, password, redirectTo = '/') => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: { username: username.trim(), full_name: full_name.trim() },
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
            },
          });
          if (error) throw error;
          if (!data.user) throw new Error('تعذر إنشاء الحساب');
          if (!data.session) {
            set({ user: null, isLoggedIn: false, isAdmin: false, loading: false });
            return { success: true, requiresConfirmation: true };
          }

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, full_name, role, avatar_url, community_role')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile fetch after register:', profileError);
          }

          const userData: User = {
            id: data.user.id,
            email: data.user.email!,
            username: profile?.username || username,
            full_name: profile?.full_name || full_name,
            role: profile?.role || 'user',
            avatar: profile?.avatar_url,
            community_role: profile?.community_role,
          };
          set({
            user: userData,
            isLoggedIn: true,
            isAdmin: userData.role === 'admin',
            loading: false,
          });
          
          return { success: true };
        } catch (err: unknown) {
          console.error('Registration error:', err);
          set({ user: null, isLoggedIn: false, isAdmin: false, loading: false });
          return { success: false, error: err instanceof Error ? err.message : 'تعذر إنشاء الحساب' };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isLoggedIn: false, isAdmin: false, loading: false });
      },

      fetchUser: async () => {
        set({ loading: true });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ user: null, isLoggedIn: false, isAdmin: false, loading: false });
            return;
          }

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, full_name, role, avatar_url, community_role')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Fetch user profile error:', error);
          }

          const userData: User = {
            id: user.id,
            email: user.email!,
            username: profile?.username || '',
            full_name: profile?.full_name || '',
            role: profile?.role || 'user',
            avatar: profile?.avatar_url,
            community_role: profile?.community_role,
          };
          set({
            user: userData,
            isLoggedIn: true,
            isAdmin: userData.role === 'admin',
            loading: false,
          });
        } catch (err) {
          console.error('fetchUser error:', err);
          set({ user: null, isLoggedIn: false, isAdmin: false, loading: false });
        }
      },
    })
);

// الاستماع لتغيرات الجلسة من Supabase
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    // جلب بيانات الملف الشخصي
    const fetchProfileAndUpdate = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, role, avatar_url, community_role')
        .eq('id', session.user.id)
        .single();

      const userData: User = {
        id: session.user.id,
        email: session.user.email!,
        username: profile?.username || '',
        full_name: profile?.full_name || '',
        role: profile?.role || 'user',
        avatar: profile?.avatar_url,
        community_role: profile?.community_role,
      };

      useAuthStore.setState({
        user: userData,
        isLoggedIn: true,
        isAdmin: userData.role === 'admin',
        loading: false,
      });
    };
    
    fetchProfileAndUpdate();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      isLoggedIn: false,
      isAdmin: false,
      loading: false,
    });
  }
});
