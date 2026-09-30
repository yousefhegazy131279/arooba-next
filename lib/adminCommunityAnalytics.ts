import type { CommunityRole } from './community-types';

export type ActivityRow = { user_id: string };
export type ActivityProfile = { username: string | null; full_name: string | null; community_role: CommunityRole | null };
export type ActivityLeader = { id: string; name: string; username: string | null; posts: number; comments: number; reactions: number; score: number };

export function summarizeCommunityActivity(
  posts: ActivityRow[], comments: ActivityRow[], reactions: ActivityRow[], profiles: Map<string, ActivityProfile>,
) {
  const activity = new Map<string, { posts: number; comments: number; reactions: number }>();
  const add = (rows: ActivityRow[], key: 'posts' | 'comments' | 'reactions') => {
    for (const row of rows) {
      const item = activity.get(row.user_id) || { posts: 0, comments: 0, reactions: 0 };
      item[key] += 1;
      activity.set(row.user_id, item);
    }
  };
  add(posts, 'posts'); add(comments, 'comments'); add(reactions, 'reactions');
  const leaders = [...activity.entries()].map(([id, item]) => {
    const profile = profiles.get(id);
    return { id, name: profile?.full_name || profile?.username || 'مستخدم عُروبة', username: profile?.username || null,
      ...item, score: item.posts * 3 + item.comments * 2 + item.reactions, role: profile?.community_role };
  }).sort((a, b) => b.score - a.score || b.posts - a.posts || a.id.localeCompare(b.id));
  return {
    participants: activity.size,
    topWriters: leaders.filter(item => item.role === 'writer').slice(0, 5),
    topReaders: leaders.filter(item => item.role === 'reader').slice(0, 5),
  };
}
