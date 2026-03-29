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
  
  export interface Chapter {
    id: string;
    title: string;
    content?: string;
    file_url?: string;
    order: number;
    novel_id: string;
    average_rating?: number;
  }