import type { CommunityRole } from './community-types';

export interface SocialMember {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  community_role: CommunityRole | null;
}

export type DirectAttachmentKind = 'image' | 'video' | 'pdf' | 'docx' | 'voice';
export interface DirectAttachment {
  path: string;
  name: string;
  kind: DirectAttachmentKind;
  size: number;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_kind: DirectAttachmentKind | null;
  attachment_size: number | null;
  is_read: boolean;
  created_at: string;
}

export interface DirectConversation {
  id: string;
  peer: SocialMember;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
}

export interface MessageCursor { id: string; created_at: string }
export interface DirectMessagePage { messages: DirectMessage[]; nextCursor: MessageCursor | null }
