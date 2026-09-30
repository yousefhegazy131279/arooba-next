'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabaseServer';
import { actionDatabaseError, requireActionUser } from '@/lib/actionAuth';
import { parseInput, usernameSchema, uuidSchema } from '@/lib/validation';
import type { DirectAttachment, DirectConversation, DirectMessage, DirectMessagePage, MessageCursor, SocialMember } from '@/lib/social-types';

const memberQuerySchema = z.object({
  search: z.string().trim().max(50).regex(/^[\p{L}\p{N}_\- ]*$/u, 'استخدم حروفًا وأرقامًا فقط في البحث'),
  role: z.enum(['all', 'reader', 'writer']),
  page: z.number().int().min(0).max(1000),
});
const cursorSchema = z.object({ id: uuidSchema, created_at: z.string().datetime({ offset: true }) });
const attachmentSchema = z.object({
  path: z.string().min(1).max(180), name: z.string().trim().min(1).max(160),
  kind: z.enum(['image', 'video', 'pdf', 'docx', 'voice']), size: z.number().int().min(1).max(41943040),
});
const memberFields = 'id,username,full_name,avatar_url,bio,community_role';
const messageFields = 'id,conversation_id,sender_id,recipient_id,body,attachment_path,attachment_name,attachment_kind,attachment_size,is_read,created_at';

export async function getMemberDirectory(input: { search: string; role: 'all' | 'reader' | 'writer'; page: number }) {
  const { search, role, page } = parseInput(memberQuerySchema, input);
  const supabase = await createClient();
  let query = supabase.from('profiles').select(memberFields, { count: 'exact' }).not('username', 'is', null);
  if (role !== 'all') query = query.eq('community_role', role);
  if (search) query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(page * 18, page * 18 + 17);
  if (error) actionDatabaseError(error, 'تعذّر تحميل أعضاء المجتمع');
  return { members: (data || []).filter(row => !!row.username) as SocialMember[], total: count || 0 };
}

export async function getSocialProfile(username: string) {
  const value = parseInput(usernameSchema, username);
  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select(memberFields).eq('username', value).maybeSingle();
  if (error) actionDatabaseError(error, 'تعذّر تحميل الملف الشخصي');
  if (!data?.username) return null;
  const { data: { user } } = await supabase.auth.getUser();
  const [followers, following, posts, followState, blockState] = await Promise.all([
    supabase.from('user_follows').select('follower_id', { count: 'exact', head: true }).eq('followed_id', data.id),
    supabase.from('user_follows').select('followed_id', { count: 'exact', head: true }).eq('follower_id', data.id),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', data.id).eq('is_hidden', false),
    user ? supabase.from('user_follows').select('follower_id').eq('follower_id', user.id).eq('followed_id', data.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    user ? supabase.from('user_blocks').select('blocker_id').eq('blocker_id', user.id).eq('blocked_id', data.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  for (const result of [followers, following, posts, followState, blockState]) {
    if (result.error) actionDatabaseError(result.error, 'تعذّر تحميل نشاط العضو');
  }
  return { member: data as SocialMember, followers: followers.count || 0, following: following.count || 0,
    posts: posts.count || 0, isFollowing: !!followState.data, isBlocked: !!blockState.data, isOwn: user?.id === data.id };
}

export async function setFollow(memberId: string, following: boolean) {
  const id = parseInput(uuidSchema, memberId);
  const chosen = parseInput(z.boolean(), following);
  const { supabase, user } = await requireActionUser('community.like');
  if (id === user.id) throw new Error('لا يمكنك متابعة نفسك');
  const result = chosen
    ? await supabase.from('user_follows').insert({ follower_id: user.id, followed_id: id })
    : await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('followed_id', id);
  if (result.error && !(chosen && result.error.code === '23505')) actionDatabaseError(result.error, 'تعذّر تحديث المتابعة');
  revalidatePath('/community/members');
  revalidatePath('/community/user/[username]', 'page');
  return { following: chosen };
}

export async function setUserBlocked(memberId: string, blocked: boolean) {
  const id = parseInput(uuidSchema, memberId);
  const chosen = parseInput(z.boolean(), blocked);
  const { supabase, user } = await requireActionUser('community.delete');
  if (id === user.id) throw new Error('لا يمكنك حظر نفسك');
  const result = chosen
    ? await supabase.from('user_blocks').insert({ blocker_id: user.id, blocked_id: id })
    : await supabase.from('user_blocks').delete().eq('blocker_id', user.id).eq('blocked_id', id);
  if (result.error && !(chosen && result.error.code === '23505')) actionDatabaseError(result.error, 'تعذّر تحديث الحظر');
  revalidatePath('/community/user/[username]', 'page');
  return { blocked: chosen };
}

export async function startConversation(memberId: string) {
  const id = parseInput(uuidSchema, memberId);
  const { supabase, user } = await requireActionUser();
  if (id === user.id) throw new Error('لا يمكنك مراسلة نفسك');
  const { data, error } = await supabase.rpc('start_direct_conversation', { p_other: id });
  if (error || !data) actionDatabaseError(error, 'تعذّر فتح المحادثة');
  revalidatePath('/community/messages');
  return data as string;
}

export async function getDirectInbox(page = 0): Promise<{ conversations: DirectConversation[]; total: number }> {
  const index = parseInput(z.number().int().min(0).max(1000), page);
  const { supabase, user } = await requireActionUser();
  const { data, count, error } = await supabase.from('direct_conversations')
    .select('id,user_low,user_high,last_message_at,last_message_preview,created_at', { count: 'exact' })
    .or(`user_low.eq.${user.id},user_high.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
    .range(index * 20, index * 20 + 19);
  if (error) actionDatabaseError(error, 'تعذّر تحميل المحادثات');
  const rows = data || [];
  if (!rows.length) return { conversations: [], total: count || 0 };
  const peerIds = rows.map(row => row.user_low === user.id ? row.user_high : row.user_low);
  const { data: profiles, error: profileError } = await supabase.from('profiles').select(memberFields).in('id', peerIds);
  if (profileError) actionDatabaseError(profileError, 'تعذّر تحميل أسماء الأعضاء');
  const profileMap = new Map((profiles || []).map(profile => [profile.id, profile as SocialMember]));
  const unread = await Promise.all(rows.map(row => supabase.from('direct_messages')
    .select('id', { count: 'exact', head: true }).eq('conversation_id', row.id).eq('recipient_id', user.id).eq('is_read', false)));
  unread.forEach(result => { if (result.error) actionDatabaseError(result.error, 'تعذّر تحميل الرسائل الجديدة'); });
  return { total: count || 0, conversations: rows.map((row, position) => ({
    id: row.id, peer: profileMap.get(peerIds[position]) || { id: peerIds[position], username: '', full_name: 'عضو عُروبة', avatar_url: null, bio: null, community_role: null },
    last_message_at: row.last_message_at, last_message_preview: row.last_message_preview,
    unread_count: unread[position].count || 0,
  })) };
}

export async function getDirectUnreadCount() {
  const { supabase, user } = await requireActionUser();
  const { count, error } = await supabase.from('direct_messages').select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id).eq('is_read', false);
  if (error) actionDatabaseError(error, 'تعذّر تحميل عدد الرسائل الجديدة');
  return count || 0;
}

export async function getDirectMessagePage(conversationId: string, cursor?: MessageCursor | null): Promise<DirectMessagePage & { peer: SocialMember }> {
  const id = parseInput(uuidSchema, conversationId);
  const before = cursor ? parseInput(cursorSchema, cursor) : null;
  const { supabase, user } = await requireActionUser();
  const { data: conversation, error: conversationError } = await supabase.from('direct_conversations')
    .select('id,user_low,user_high').eq('id', id).maybeSingle();
  if (conversationError || !conversation) actionDatabaseError(conversationError, 'المحادثة غير متاحة');
  const peerId = conversation.user_low === user.id ? conversation.user_high : conversation.user_low;
  const { data: peer, error: peerError } = await supabase.from('profiles').select(memberFields).eq('id', peerId).maybeSingle();
  if (peerError) actionDatabaseError(peerError, 'تعذّر تحميل العضو');
  let query = supabase.from('direct_messages').select(messageFields).eq('conversation_id', id)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(31);
  if (before) query = query.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`);
  const { data, error } = await query;
  if (error) actionDatabaseError(error, 'تعذّر تحميل الرسائل');
  const rows = (data || []) as DirectMessage[];
  const oldest = rows[29];
  return { messages: rows.slice(0, 30).reverse(), nextCursor: rows.length > 30 && oldest ? { id: oldest.id, created_at: oldest.created_at } : null,
    peer: (peer as SocialMember | null) || { id: peerId, username: '', full_name: 'عضو عُروبة', avatar_url: null, bio: null, community_role: null } };
}

export async function markDirectMessagesRead(conversationId: string) {
  const id = parseInput(uuidSchema, conversationId);
  const { supabase, user } = await requireActionUser();
  const { error } = await supabase.from('direct_messages').update({ is_read: true })
    .eq('conversation_id', id).eq('recipient_id', user.id).eq('is_read', false);
  if (error) actionDatabaseError(error, 'تعذّر تحديث حالة القراءة');
  return { success: true as const };
}

export async function sendDirectMessage(conversationId: string, body: string, attachment?: DirectAttachment | null): Promise<DirectMessage> {
  const id = parseInput(uuidSchema, conversationId);
  const content = parseInput(z.string().trim().max(5000), body);
  const file = attachment ? parseInput(attachmentSchema, attachment) : null;
  if (!content && !file) throw new Error('اكتب رسالة أو اختر ملفًا');
  const { supabase, user } = await requireActionUser();
  const { data, error } = await supabase.from('direct_messages').insert({
    conversation_id: id, sender_id: user.id, body: content,
    attachment_path: file?.path || null, attachment_name: file?.name || null,
    attachment_kind: file?.kind || null, attachment_size: file?.size || null,
  }).select(messageFields).single();
  if (error) actionDatabaseError(error, 'تعذّر إرسال الرسالة');
  revalidatePath('/community/messages');
  return data as DirectMessage;
}

export async function getDirectAttachmentUrl(messageId: string) {
  const id = parseInput(uuidSchema, messageId);
  const { supabase } = await requireActionUser();
  const { data, error } = await supabase.from('direct_messages').select('attachment_path').eq('id', id).maybeSingle();
  if (error || !data?.attachment_path) actionDatabaseError(error, 'الملف غير متاح');
  const { data: signed, error: signError } = await supabase.storage.from('direct-media').createSignedUrl(data.attachment_path, 3600);
  if (signError || !signed?.signedUrl) actionDatabaseError(signError, 'تعذّر فتح الملف');
  return signed.signedUrl;
}
