// types/index.ts
export interface Novel {
    id: string;
    title: string;
    author: string;
    description: string;
    cover_url?: string;
    category?: string;
    created_at: string;
    average_rating?: number;
    chapters_count?: number;
  }
  
// مثال types/supabase.ts
export interface Chapter {
  id: string;
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  cover_image?: string | null; // ✅ الجديد
  created_at: string;
  updated_at: string;
}