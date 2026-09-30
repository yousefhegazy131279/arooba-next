'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabaseServer';
import { actionDatabaseError, requireActionUser, requireAdmin } from '@/lib/actionAuth';
import { commentContentSchema, parseInput, postContentSchema, reportReasonSchema, usernameSchema, uuidSchema } from '@/lib/validation';
import type { CommunityAttachment, CommunityComment, CommunityCursor, CommunityFeedPage, CommunityNotification, CommunityPost, CommunityProfile, CommunityReaction, CommunityRole, CommunityReport, CommunityUser } from '@/lib/community-types';

const postFields = 'id,user_id,content,created_at,updated_at,likes_count,comments_count,is_hidden,author_kind,attachments';
const limitSchema = z.number().int().min(1).max(50);
const offsetSchema = z.number().int().min(0).max(10000);
const cursorSchema = z.object({ id: uuidSchema, created_at: z.string().datetime({ offset: true }) });
type PostRow = Omit<CommunityPost, 'user' | 'is_liked' | 'reactions' | 'my_reaction'>;
type CommentRow = Omit<CommunityComment, 'user'>;
const unknownUser: CommunityUser = { username: null, full_name: 'قارئ عُروبة', avatar_url: null };

async function profilesFor(supabase: SupabaseClient, ids: string[]) {
  if (!ids.length) return new Map<string, CommunityUser>();
  // No implicit profile/auth.users join: the original schema has no such FK.
  const { data, error } = await supabase.from('profiles').select('id,username,full_name,avatar_url').in('id', [...new Set(ids)]);
  if (error) actionDatabaseError(error, 'تعذر تحميل بيانات الكتّاب');
  return new Map((data || []).map((profile: CommunityProfile) => [profile.id, {
    username: profile.username, full_name: profile.full_name, avatar_url: profile.avatar_url,
  }]));
}

async function hydratePosts(supabase: SupabaseClient, rows: PostRow[], viewerId?: string): Promise<CommunityPost[]> {
  const profiles = await profilesFor(supabase, rows.map(row => row.user_id));
  const likedIds = new Set<string>();
  const reactions = new Map<string, { approve: number; meh: number; boo: number; mine: CommunityReaction | null }>();
  if (rows.length) {
    const { data, error } = await supabase.from('post_reactions').select('post_id,user_id,reaction').in('post_id', rows.map(row => row.id));
    if (error) actionDatabaseError(error, 'تعذر تحميل تقييمات الأعمال');
    for (const reaction of data || []) {
      const tally = reactions.get(reaction.post_id) || { approve: 0, meh: 0, boo: 0, mine: null };
      const kind = reaction.reaction as CommunityReaction;
      tally[kind] += 1;
      if (reaction.user_id === viewerId) tally.mine = kind;
      reactions.set(reaction.post_id, tally);
    }
  }
  if (viewerId && rows.length) {
    const { data, error } = await supabase.from('likes').select('post_id').eq('user_id', viewerId).in('post_id', rows.map(row => row.id));
    if (error) actionDatabaseError(error, 'تعذر تحميل الإعجابات');
    for (const like of data || []) likedIds.add(like.post_id);
  }
  return rows.map(row => ({ ...row, attachments: row.attachments || [], user: profiles.get(row.user_id) || unknownUser, is_liked: likedIds.has(row.id), reactions: reactions.get(row.id) || { approve: 0, meh: 0, boo: 0 }, my_reaction: reactions.get(row.id)?.mine || null }));
}

async function readContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function refreshPost(postId?: string) {
  revalidatePath('/community');
  revalidatePath('/community/user/[username]', 'page');
  if (postId) revalidatePath(`/community/post/${postId}`);
}

export async function getPublicProfile(username: string): Promise<CommunityProfile | null> {
  const value = parseInput(usernameSchema, username);
  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('id,username,full_name,avatar_url,community_role').eq('username', value).maybeSingle();
  if (error) actionDatabaseError(error, 'تعذر تحميل الملف الشخصي');
  return data;
}

export async function getCommunityRole(): Promise<CommunityRole | null> {
  const { supabase, user } = await requireActionUser();
  const { data, error } = await supabase.from('profiles').select('community_role').eq('id', user.id).single();
  if (error) actionDatabaseError(error, 'تعذر تحميل نوع العضوية');
  return data?.community_role === 'reader' || data?.community_role === 'writer' ? data.community_role : null;
}

export async function setCommunityRole(role: CommunityRole) {
  const chosen = parseInput(z.enum(['reader', 'writer']), role);
  const { supabase, user } = await requireActionUser();
  const { error } = await supabase.from('profiles').update({ community_role: chosen }).eq('id', user.id);
  if (error) actionDatabaseError(error, 'تعذر تحديث نوع العضوية');
  revalidatePath('/community');
  return chosen;
}

export async function getFeedPage(limit = 10, cursor?: CommunityCursor | null, username?: string, kind?: CommunityRole): Promise<CommunityFeedPage> {
  const count = parseInput(limitSchema, limit);
  const after = cursor ? parseInput(cursorSchema, cursor) : null;
  const { supabase, user } = await readContext();
  let query = supabase.from('posts').select(postFields).eq('is_hidden', false)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(count + 1);
  if (kind) query = query.eq('author_kind', parseInput(z.enum(['reader', 'writer']), kind));
  if (username !== undefined) {
    const profile = await getPublicProfile(username);
    if (!profile) return { posts: [], nextCursor: null };
    query = query.eq('user_id', profile.id);
  }
  if (after) {
    // Both interpolated values were strictly validated above.
    query = query.or(`created_at.lt.${after.created_at},and(created_at.eq.${after.created_at},id.lt.${after.id})`);
  }
  const { data, error } = await query;
  if (error) actionDatabaseError(error, 'تعذر تحميل المجتمع. حاول مجدداً');
  const rows = (data || []) as PostRow[];
  const posts = await hydratePosts(supabase, rows.slice(0, count), user?.id);
  const last = posts.at(-1);
  return { posts, nextCursor: rows.length > count && last ? { created_at: last.created_at, id: last.id } : null };
}

export async function getFeed(limit = 10, offset = 0, username?: string): Promise<CommunityPost[]> {
  const count = parseInput(limitSchema, limit);
  const start = parseInput(offsetSchema, offset);
  const { supabase, user } = await readContext();
  let query = supabase.from('posts').select(postFields).eq('is_hidden', false)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, start + count - 1);
  if (username !== undefined) {
    const profile = await getPublicProfile(username);
    if (!profile) return [];
    query = query.eq('user_id', profile.id);
  }
  const { data, error } = await query;
  if (error) actionDatabaseError(error, 'تعذر تحميل المنشورات');
  return hydratePosts(supabase, (data || []) as PostRow[], user?.id);
}

export async function getPost(postId: string): Promise<CommunityPost | null> {
  const id = parseInput(uuidSchema, postId);
  const { supabase, user } = await readContext();
  const { data, error } = await supabase.from('posts').select(postFields).eq('id', id).eq('is_hidden', false).maybeSingle();
  if (error) actionDatabaseError(error, 'تعذر تحميل المنشور');
  return data ? (await hydratePosts(supabase, [data as PostRow], user?.id))[0] : null;
}

export async function createPost(content: string, attachments: CommunityAttachment[] = []): Promise<CommunityPost> {
  const value = parseInput(postContentSchema, content);
  const files = parseInput(z.array(z.object({
    path: z.string().max(180), name: z.string().trim().min(1).max(160),
    type: z.enum(['image', 'video', 'pdf', 'docx']),
  })).max(4), attachments);
  // The database trigger enforces the quota, including direct REST writes.
  const { supabase, user } = await requireActionUser();
  const { data, error } = await supabase.from('posts').insert({ user_id: user.id, content: value, attachments: files }).select(postFields).single();
  if (error) actionDatabaseError(error, 'تعذر نشر المنشور');
  refreshPost();
  return (await hydratePosts(supabase, [data as PostRow], user.id))[0];
}

export async function reactToPost(postId: string, reaction: CommunityReaction | null) {
  const id = parseInput(uuidSchema, postId);
  const chosen = reaction === null ? null : parseInput(z.enum(['approve', 'meh', 'boo']), reaction);
  const { supabase, user } = await requireActionUser();
  const { data: existing, error: lookupError } = await supabase.from('post_reactions')
    .select('reaction').eq('post_id', id).eq('user_id', user.id).maybeSingle();
  if (lookupError) actionDatabaseError(lookupError, 'تعذر تحميل تقييمك');
  const { error } = chosen === null
    ? await supabase.from('post_reactions').delete().eq('post_id', id).eq('user_id', user.id)
    : existing
      ? await supabase.from('post_reactions').update({ reaction: chosen }).eq('post_id', id).eq('user_id', user.id)
      : await supabase.from('post_reactions').insert({ post_id: id, user_id: user.id, reaction: chosen });
  if (error) actionDatabaseError(error, 'تعذر حفظ تقييمك');
  refreshPost(id);
  return { success: true as const };
}

export async function updatePost(postId: string, content: string) {
  const id = parseInput(uuidSchema, postId);
  const value = parseInput(postContentSchema, content);
  const { supabase, user } = await requireActionUser();
  const { error } = await supabase.from('posts').update({ content: value }).eq('id', id).eq('user_id', user.id).select('id').single();
  if (error) actionDatabaseError(error, 'تعذر تعديل المنشور');
  refreshPost(id);
  return { success: true as const };
}

export async function deletePost(postId: string) {
  const id = parseInput(uuidSchema, postId);
  const { supabase, user } = await requireActionUser();
  const { data: post, error: lookupError } = await supabase.from('posts').select('attachments').eq('id', id).eq('user_id', user.id).single();
  if (lookupError) actionDatabaseError(lookupError, 'تعذر تحميل ملفات المنشور');
  const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', user.id).select('id').single();
  if (error) actionDatabaseError(error, 'تعذر حذف المنشور');
  const paths = ((post.attachments || []) as CommunityAttachment[]).map(item => item.path);
  if (paths.length) await supabase.storage.from('community-media').remove(paths);
  refreshPost(id);
  return { success: true as const };
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likes_count: number }> {
  const id = parseInput(uuidSchema, postId);
  const { supabase } = await requireActionUser();
  const { data, error } = await supabase.rpc('toggle_community_like', { p_post_id: id });
  if (error || !data?.[0]) actionDatabaseError(error, 'تعذر تحديث الإعجاب');
  refreshPost(id);
  return { liked: Boolean(data[0].liked), likes_count: Number(data[0].likes_count) };
}

export async function getComments(postId: string, limit = 50, offset = 0): Promise<CommunityComment[]> {
  const id = parseInput(uuidSchema, postId);
  const count = parseInput(limitSchema, limit);
  const start = parseInput(offsetSchema, offset);
  const supabase = await createClient();
  const { data, error } = await supabase.from('comments').select('id,post_id,user_id,content,created_at')
    .eq('post_id', id).order('created_at').order('id').range(start, start + count - 1);
  // RLS filters comments whose parent is hidden, even for moderators.
  if (error) actionDatabaseError(error, 'تعذر تحميل التعليقات');
  const rows = (data || []) as CommentRow[];
  const profiles = await profilesFor(supabase, rows.map(row => row.user_id));
  return rows.map(row => ({ ...row, user: profiles.get(row.user_id) || unknownUser }));
}

export async function addComment(postId: string, content: string): Promise<CommunityComment> {
  const id = parseInput(uuidSchema, postId);
  const value = parseInput(commentContentSchema, content);
  const { supabase, user } = await requireActionUser();
  const { data, error } = await supabase.from('comments').insert({ user_id: user.id, post_id: id, content: value })
    .select('id,post_id,user_id,content,created_at').single();
  if (error) actionDatabaseError(error, 'تعذر إضافة التعليق');
  const profiles = await profilesFor(supabase, [user.id]);
  refreshPost(id);
  return { ...data as CommentRow, user: profiles.get(user.id) || unknownUser };
}

export async function deleteComment(commentId: string) {
  const id = parseInput(uuidSchema, commentId);
  const { supabase, user } = await requireActionUser();
  const { data, error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', user.id).select('post_id').single();
  if (error) actionDatabaseError(error, 'تعذر حذف التعليق');
  refreshPost(data.post_id);
  return { success: true as const };
}

export async function reportPost(postId: string, reason: string) {
  const id = parseInput(uuidSchema, postId);
  const value = parseInput(reportReasonSchema, reason);
  const { supabase, user } = await requireActionUser();
  const { error } = await supabase.from('reports').insert({ post_id: id, reporter_id: user.id, reason: value });
  if (error) actionDatabaseError(error, 'تعذر إرسال الإبلاغ');
  return { success: true as const };
}

export async function getNotifications(): Promise<CommunityNotification[]> {
  const { supabase, user } = await requireActionUser();
  const { data, error } = await supabase.from('notifications').select('id,type,post_id,actor_id,content,is_read,created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  if (error) actionDatabaseError(error, 'تعذر تحميل الإشعارات');
  const actorIds = [...new Set((data || []).map(item => item.actor_id).filter((id): id is string => !!id))];
  if (!actorIds.length) return (data || []) as CommunityNotification[];
  const { data: actors, error: actorsError } = await supabase.from('profiles')
    .select('id,username,full_name,avatar_url').in('id', actorIds);
  if (actorsError) actionDatabaseError(actorsError, 'تعذر تحميل أصحاب الإشعارات');
  const byId = new Map((actors || []).map(actor => [actor.id, actor]));
  return (data || []).map(item => ({ ...item, actor: item.actor_id ? byId.get(item.actor_id) || null : null })) as CommunityNotification[];
}

export async function markNotificationsRead(ids?: string[]) {
  const values = ids === undefined ? undefined : parseInput(z.array(uuidSchema).min(1).max(50), ids);
  const { supabase, user } = await requireActionUser('community.notification');
  let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  if (values) query = query.in('id', values);
  const { error } = await query;
  if (error) actionDatabaseError(error, 'تعذر تحديث الإشعارات');
  revalidatePath('/community/notifications');
  return { success: true as const };
}

export async function getModerationReports(): Promise<CommunityReport[]> {
  const { supabase, user } = await requireAdmin('admin.read');
  const { data, error } = await supabase.from('reports').select('id,post_id,reporter_id,reason,status,created_at')
    .order('created_at', { ascending: false }).limit(100);
  if (error) actionDatabaseError(error, 'تعذر تحميل الإبلاغات');
  if (!data?.length) return [];
  const { data: postRows, error: postsError } = await supabase.from('posts').select(postFields).in('id', [...new Set(data.map(row => row.post_id))]);
  if (postsError) actionDatabaseError(postsError, 'تعذر تحميل المنشورات المبلّغ عنها');
  const posts = await hydratePosts(supabase, (postRows || []) as PostRow[], user.id);
  const postMap = new Map(posts.map(post => [post.id, post]));
  return data.map(row => ({ ...row, post: postMap.get(row.post_id) || null })) as CommunityReport[];
}

export async function moderateReport(reportId: string, action: 'hide' | 'dismiss' | 'restore') {
  const id = parseInput(uuidSchema, reportId);
  const value = parseInput(z.enum(['hide', 'dismiss', 'restore']), action);
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('moderate_community_report', { p_report_id: id, p_action: value });
  if (error) actionDatabaseError(error, 'تعذر تنفيذ إجراء الإشراف');
  revalidatePath('/community', 'layout');
  revalidatePath('/admin');
  return { success: true as const };
}
