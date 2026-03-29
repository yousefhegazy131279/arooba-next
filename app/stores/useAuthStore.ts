// app/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, full_name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      isLoggedIn: false,
      isAdmin: false,

      login: async (email, password) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, full_name, role, avatar_url')
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
          };

          console.log('User logged in:', userData); // تأكد من وجود username

          set({
            user: userData,
            isLoggedIn: true,
            isAdmin: userData.role === 'admin',
            loading: false,
          });
          return { success: true };
        } catch (err: any) {
          console.error('Login error:', err);
          set({ loading: false });
          return { success: false, error: err.message };
        }
      },

      register: async (username, full_name, email, password) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { username, full_name },
            },
          });
          if (error) throw error;

          // انتظر لحظة لضمان اكتمال trigger
          await new Promise(resolve => setTimeout(resolve, 500));

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, full_name, role, avatar_url')
            .eq('id', data.user!.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile fetch after register:', profileError);
          }

          const userData: User = {
            id: data.user!.id,
            email: data.user!.email!,
            username: profile?.username || username,
            full_name: profile?.full_name || full_name,
            role: profile?.role || 'user',
            avatar: profile?.avatar_url,
          };

          console.log('User registered:', userData); // تأكد من وجود username

          set({
            user: userData,
            isLoggedIn: true,
            isAdmin: userData.role === 'admin',
            loading: false,
          });
          return { success: true };
        } catch (err: any) {
          console.error('Registration error:', err);
          set({ loading: false });
          return { success: false, error: err.message };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isLoggedIn: false, isAdmin: false });
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
            .select('username, full_name, role, avatar_url')
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
          };

          console.log('Fetched user:', userData); // تأكد من وجود username

          set({
            user: userData,
            isLoggedIn: true,
            isAdmin: userData.role === 'admin',
            loading: false,
          });
        } catch (err) {
          console.error('fetchUser error:', err);
          set({ loading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        isAdmin: state.isAdmin,
      }),
    }
  )
);