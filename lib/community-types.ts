export interface CommunityUser {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface CommunityProfile extends CommunityUser { id: string }

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  user: CommunityUser;
  is_hidden?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: CommunityUser;
}

export interface CommunityCursor { created_at: string; id: string }
export interface CommunityFeedPage { posts: CommunityPost[]; nextCursor: CommunityCursor | null }

export interface CommunityNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  post_id: string | null;
  actor_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CommunityReport {
  id: string;
  post_id: string;
  reporter_id: string | null;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  post: CommunityPost | null;
}
