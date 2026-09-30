'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/actionAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { parseInput, uuidSchema } from '@/lib/validation';
import type { CommunityAttachment, CommunityRole } from '@/lib/community-types';
import { summarizeCommunityActivity, type ActivityLeader } from '@/lib/adminCommunityAnalytics';

const filterSchema = z.object({
  page: z.number().int().min(0).max(10000),
  role: z.enum(['all', 'reader', 'writer']),
  visibility: z.enum(['all', 'visible', 'hidden']),
  search: z.string().trim().max(100),
});
export type PostFilters = z.infer<typeof filterSchema>;
export type AdminPost = {
  id: string; user_id: string; content: string; created_at: string;
  author_kind: CommunityRole; is_hidden: boolean; is_reported: boolean;
  likes_count: number; comments_count: number; attachments: CommunityAttachment[];
  author: { username: string | null; full_name: string | null } | null;
  pendingReports: number; reactions: { approve: number; meh: number; boo: number };
};
export type CommunityOverview = {
  readers: number; writers: number; posts: number; visiblePosts: number; hiddenPosts: number;
  writerPosts: number; comments: number; approvals: number; meh: number; boos: number;
  pendingReports: number; postsThisWeek: number; participantsThisMonth: number;
  latestPublisher: { name: string; username: string | null; at: string; postId: string; hidden: boolean } | null;
  topWriters: ActivityLeader[]; topReaders: ActivityLeader[];
  reports: { id: string; post_id: string; reason: string; created_at: string; status: string; postContent: string | null }[];
};

function check(error: { message: string } | null) {
  if (error) throw new Error('تعذّر تحميل بيانات المجتمع. حاول مجددًا.');
}

async function profilesFor(ids: string[]) {
  const profiles = new Map<string, { username: string | null; full_name: string | null; community_role: CommunityRole | null }>();
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data, error } = await supabaseAdmin.from('profiles').select('id,username,full_name,community_role').in('id', ids.slice(offset, offset + 100));
    check(error);
    for (const profile of data || []) profiles.set(profile.id, profile as { username: string | null; full_name: string | null; community_role: CommunityRole | null });
  }
  return profiles;
}

async function allRecent(table: 'posts' | 'comments' | 'post_reactions', since: string) {
  const rows: { user_id: string; created_at: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabaseAdmin.from(table).select('user_id,created_at').gte('created_at', since)
      .order('created_at', { ascending: false }).range(offset, offset + 999);
    check(error);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export async function getAdminCommunityOverview(): Promise<CommunityOverview> {
  await requireAdmin('admin.read');
  const sinceWeek = new Date(Date.now() - 7 * 86400000).toISOString();
  const sinceMonth = new Date(Date.now() - 30 * 86400000).toISOString();
  const counts = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('community_role', 'reader'),
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('community_role', 'writer'),
    supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('is_hidden', false),
    supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('is_hidden', true),
    supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('author_kind', 'writer'),
    supabaseAdmin.from('comments').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('post_reactions').select('post_id', { count: 'exact', head: true }).eq('reaction', 'approve'),
    supabaseAdmin.from('post_reactions').select('post_id', { count: 'exact', head: true }).eq('reaction', 'meh'),
    supabaseAdmin.from('post_reactions').select('post_id', { count: 'exact', head: true }).eq('reaction', 'boo'),
    supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', sinceWeek),
  ]);
  counts.forEach(result => check(result.error));
  const [readers, writers, posts, visiblePosts, hiddenPosts, writerPosts, comments, approvals, meh, boos, pendingReports, postsThisWeek] = counts.map(result => result.count || 0);
  const [recentPosts, recentComments, recentReactions, latestResult, reportResult] = await Promise.all([
    allRecent('posts', sinceMonth), allRecent('comments', sinceMonth), allRecent('post_reactions', sinceMonth),
    supabaseAdmin.from('posts').select('id,user_id,created_at,is_hidden').order('created_at', { ascending: false }).limit(1),
    supabaseAdmin.from('reports').select('id,post_id,reason,created_at,status').eq('status', 'pending').order('created_at', { ascending: false }).limit(8),
  ]);
  check(latestResult.error); check(reportResult.error);
  const latest = latestResult.data?.[0];
  const reports = reportResult.data || [];
  const ids = [...new Set([...recentPosts, ...recentComments, ...recentReactions].map(row => row.user_id).concat(latest ? [latest.user_id] : []))];
  const profileMap = await profilesFor(ids);
  const activity = summarizeCommunityActivity(recentPosts, recentComments, recentReactions, profileMap);
  const postIds = [...new Set(reports.map(report => report.post_id))];
  const { data: reportedPosts, error: postError } = postIds.length
    ? await supabaseAdmin.from('posts').select('id,content').in('id', postIds)
    : { data: [], error: null };
  check(postError);
  const reportedContent = new Map((reportedPosts || []).map(post => [post.id, post.content]));
  const latestProfile = latest ? profileMap.get(latest.user_id) : null;
  return {
    readers, writers, posts, visiblePosts, hiddenPosts, writerPosts, comments, approvals, meh, boos, pendingReports, postsThisWeek,
    participantsThisMonth: activity.participants,
    latestPublisher: latest ? { name: latestProfile?.full_name || latestProfile?.username || 'مستخدم عُروبة', username: latestProfile?.username || null, at: latest.created_at, postId: latest.id, hidden: latest.is_hidden } : null,
    topWriters: activity.topWriters,
    topReaders: activity.topReaders,
    reports: reports.map(report => ({ ...report, postContent: reportedContent.get(report.post_id) || null })),
  };
}

export async function getAdminCommunityPosts(input: PostFilters): Promise<{ posts: AdminPost[]; total: number }> {
  await requireAdmin('admin.read');
  const filters = parseInput(filterSchema, input);
  const size = 12;
  let query = supabaseAdmin.from('posts').select('id,user_id,content,created_at,author_kind,is_hidden,is_reported,likes_count,comments_count,attachments', { count: 'exact' });
  if (filters.role !== 'all') query = query.eq('author_kind', filters.role);
  if (filters.visibility !== 'all') query = query.eq('is_hidden', filters.visibility === 'hidden');
  if (filters.search) query = query.ilike('content', `%${filters.search.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`);
  const { data, count, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).range(filters.page * size, (filters.page + 1) * size - 1);
  check(error);
  const rows = data || [];
  if (!rows.length) return { posts: [], total: count || 0 };
  const profiles = await profilesFor([...new Set(rows.map(row => row.user_id))]);
  const postIds = rows.map(row => row.id);
  const [reactionResult, reportResult] = await Promise.all([
    supabaseAdmin.from('post_reactions').select('post_id,reaction').in('post_id', postIds),
    supabaseAdmin.from('reports').select('post_id').in('post_id', postIds).eq('status', 'pending'),
  ]);
  check(reactionResult.error); check(reportResult.error);
  const reactions = new Map<string, { approve: number; meh: number; boo: number }>();
  for (const row of reactionResult.data || []) {
    const tally = reactions.get(row.post_id) || { approve: 0, meh: 0, boo: 0 };
    if (row.reaction === 'approve' || row.reaction === 'meh' || row.reaction === 'boo') tally[row.reaction as keyof typeof tally]++;
    reactions.set(row.post_id, tally);
  }
  const reports = new Map<string, number>();
  for (const row of reportResult.data || []) reports.set(row.post_id, (reports.get(row.post_id) || 0) + 1);
  return { total: count || 0, posts: rows.map(row => ({
    ...row, attachments: (row.attachments || []) as CommunityAttachment[],
    author: profiles.get(row.user_id) || null, pendingReports: reports.get(row.id) || 0,
    reactions: reactions.get(row.id) || { approve: 0, meh: 0, boo: 0 },
  })) as AdminPost[] };
}

function refreshCommunity(id: string) {
  revalidatePath('/admin/community');
  revalidatePath('/community', 'layout');
  revalidatePath(`/community/post/${id}`);
}

export async function setAdminPostVisibility(postId: string, hidden: boolean) {
  await requireAdmin('admin.write');
  const id = parseInput(uuidSchema, postId);
  const value = parseInput(z.boolean(), hidden);
  const { data, error } = await supabaseAdmin.from('posts').update({ is_hidden: value }).eq('id', id).select('id').maybeSingle();
  check(error);
  if (!data) throw new Error('المنشور غير موجود.');
  refreshCommunity(id);
  return { success: true as const };
}

export async function deleteAdminCommunityPost(postId: string) {
  await requireAdmin('admin.write');
  const id = parseInput(uuidSchema, postId);
  const { data, error } = await supabaseAdmin.from('posts').select('id,user_id,attachments').eq('id', id).maybeSingle();
  check(error);
  if (!data) throw new Error('المنشور غير موجود.');
  const { error: deleteError } = await supabaseAdmin.from('posts').delete().eq('id', id);
  check(deleteError);
  const paths = ((data.attachments || []) as CommunityAttachment[]).map(item => item.path)
    .filter(path => path.startsWith(`${data.user_id}/`));
  let mediaWarning = false;
  if (paths.length) {
    const { error: mediaError } = await supabaseAdmin.storage.from('community-media').remove(paths);
    mediaWarning = Boolean(mediaError);
  }
  refreshCommunity(id);
  return { success: true as const, mediaWarning };
}
