'use client';
/* eslint-disable @next/next/no-img-element -- Private signed attachment URLs expire. */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  clearDirectConversation,
  getDirectAttachmentUrl,
  getDirectInbox,
  getDirectMessagePage,
  markDirectMessagesRead,
  sendDirectMessage,
} from '@/app/community/social/actions';
import { supabase } from '@/lib/supabaseClient';
import type {
  DirectAttachment,
  DirectAttachmentKind,
  DirectConversation,
  DirectMessage,
  DirectMessagePage,
  SocialMember,
} from '@/lib/social-types';
import Avatar from './Avatar';
import ChatIcon from './ChatIcon';
import EmojiPicker from './EmojiPicker';
import styles from './DirectMessages.module.css';

type Thread = DirectMessagePage & { peer: SocialMember };

const acceptedTypes: Record<string, { kind: DirectAttachmentKind; ext: string }> = {
  'image/jpeg': { kind: 'image', ext: 'jpg' },
  'image/png': { kind: 'image', ext: 'png' },
  'image/webp': { kind: 'image', ext: 'webp' },
  'image/gif': { kind: 'image', ext: 'gif' },
  'video/mp4': { kind: 'video', ext: 'mp4' },
  'video/webm': { kind: 'video', ext: 'webm' },
  'application/pdf': { kind: 'pdf', ext: 'pdf' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { kind: 'docx', ext: 'docx' },
  'audio/webm': { kind: 'voice', ext: 'webm' },
  'audio/mp4': { kind: 'voice', ext: 'mp4' },
  'audio/ogg': { kind: 'voice', ext: 'ogg' },
  'audio/mpeg': { kind: 'voice', ext: 'mp3' },
};

const maxFileSize = 40 * 1024 * 1024;

function displayName(m: SocialMember) {
  return m.full_name || m.username || 'عضو عُروبة';
}

function time(v: string) {
  return new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit' }).format(new Date(v));
}

function relativeTime(v: string) {
  const diff = Math.floor((Date.now() - new Date(v).getTime()) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ي`;
  return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }).format(new Date(v));
}

/* ===== مرفق ===== */
function MessageAttachment({ message }: { message: DirectMessage }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!message.attachment_path) return;
    let active = true;
    getDirectAttachmentUrl(message.id)
      .then((v) => active && setUrl(v))
      .catch(() => active && setError('تعذّر فتح المرفق'));
    return () => { active = false; };
  }, [message.id, message.attachment_path]);

  if (!message.attachment_path) return null;
  if (error) return <span className={styles.error}>{error}</span>;
  if (!url) return <span className={styles.loading}>جارٍ التحميل…</span>;

  const name = message.attachment_name || 'مرفق';
  if (message.attachment_kind === 'image')
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img className={styles.attachImage} src={url} alt={name} />
      </a>
    );
  if (message.attachment_kind === 'video')
    return <video className={styles.attachVideo} controls preload="metadata" src={url} />;
  if (message.attachment_kind === 'voice')
    return <audio className={styles.attachAudio} controls preload="metadata" src={url} />;
  return (
    <a className={styles.attachFile} href={url} target="_blank" rel="noopener noreferrer" download={name}>
      <ChatIcon name="file" size={20} />
      <span>
        <strong>{name}</strong>
        <small>{message.attachment_kind === 'pdf' ? 'PDF' : 'Word'}</small>
      </span>
    </a>
  );
}

/* ===== المكوّن الرئيسي ===== */
export default function DirectMessages({
  userId,
  initialInbox,
  initialSelectedId,
  initialThread,
}: {
  userId: string;
  initialInbox: { conversations: DirectConversation[]; total: number };
  initialSelectedId: string | null;
  initialThread: Thread | null;
}) {
  const [inbox, setInbox] = useState(initialInbox);
  const [inboxPage, setInboxPage] = useState(0);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [thread, setThread] = useState<Thread | null>(initialThread);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const selectedRef = useRef(selectedId);
  const initializedRef = useRef(false);
  const router = useRouter();
  selectedRef.current = selectedId;

  const refreshInbox = useCallback(async () => {
    try {
      const pages = await Promise.all(Array.from({ length: inboxPage + 1 }, (_, i) => getDirectInbox(i)));
      const unique = new Map<string, DirectConversation>();
      pages.forEach((p) => p.conversations.forEach((c) => unique.set(c.id, c)));
      setInbox({ conversations: [...unique.values()], total: pages[0].total });
    } catch {}
  }, [inboxPage]);

  const refreshThread = useCallback(
    async (id: string) => {
      try {
        const result = await getDirectMessagePage(id);
        if (selectedRef.current === id) {
          setThread(result);
          await markDirectMessagesRead(id);
          void refreshInbox();
        }
      } catch (issue) {
        if (selectedRef.current === id)
          setError(issue instanceof Error ? issue.message : 'تعذّر تحميل المحادثة');
      }
    },
    [refreshInbox]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (selectedId && !initialThread) void refreshThread(selectedId);
    if (selectedId && initialThread)
      void markDirectMessagesRead(selectedId).then(refreshInbox).catch(() => {});
  }, [selectedId, initialThread, refreshThread, refreshInbox]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [thread?.messages.length, selectedId]);

  useEffect(() => {
    const channel = supabase
      .channel(`dm-page-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          void refreshInbox();
          const row = payload.new as DirectMessage;
          if (row.conversation_id === selectedRef.current) void refreshThread(row.conversation_id);
        }
      )
      .subscribe();
    const fallback = window.setInterval(() => {
      void refreshInbox();
      if (selectedRef.current) void refreshThread(selectedRef.current);
    }, 25000);
    return () => {
      window.clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
  }, [userId, refreshInbox, refreshThread]);

  useEffect(
    () => () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const selectThread = (id: string) => {
    if (id === selectedId) return;
    selectedRef.current = id;
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
    }
    setSelectedId(id);
    setThread(null);
    setError('');
    setFile(null);
    setBody('');
    window.history.replaceState(null, '', `/community/messages?thread=${id}`);
    void refreshThread(id);
  };

  const clearThread = async () => {
    if (!selectedId || clearing) return;
    if (!window.confirm('هل تريد حذف هذه المحادثة من صندوقك؟')) return;
    const id = selectedId;
    setClearing(true);
    try {
      await clearDirectConversation(id);
      selectedRef.current = null;
      setSelectedId(null);
      setThread(null);
      setInboxPage(0);
      setInbox((c) => ({
        conversations: c.conversations.filter((i) => i.id !== id),
        total: Math.max(0, c.total - 1),
      }));
      window.history.replaceState(null, '', '/community/messages');
      window.dispatchEvent(new Event('direct-inbox-changed'));
      void getDirectInbox().then(setInbox).catch(() => {});
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'تعذّر حذف المحادثة');
    } finally {
      setClearing(false);
    }
  };

  const loadMoreMessages = () => {
    if (!selectedId || !thread?.nextCursor) return;
    const id = selectedId;
    const cursor = thread.nextCursor;
    startTransition(async () => {
      try {
        const older = await getDirectMessagePage(id, cursor);
        if (selectedRef.current === id)
          setThread((c) =>
            c ? { ...c, messages: [...older.messages, ...c.messages], nextCursor: older.nextCursor } : c
          );
      } catch {}
    });
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('التسجيل غير مدعوم');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported(t));
      if (!mime) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error('صيغة التسجيل غير مدعومة');
      }
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const recordingId = selectedRef.current;
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunks, { type: mime });
        if (blob.size && recordingId === selectedRef.current)
          setFile(new File([blob], `صوتية.${acceptedTypes[mime].ext}`, { type: mime }));
      };
      recorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start();
      setRecording(true);
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'تعذّر الوصول للميكروفون');
    }
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || busy || (!body.trim() && !file)) return;
    const id = selectedId;
    let attachment: DirectAttachment | null = null;
    setBusy(true);
    setError('');
    try {
      if (file) {
        const type = acceptedTypes[file.type];
        if (!type) throw new Error('صيغة الملف غير مدعومة.');
        if (file.size > maxFileSize) throw new Error('حجم الملف يتجاوز 40 ميغا');
        const path = `${id}/${userId}/${crypto.randomUUID()}.${type.ext}`;
        const { error: upErr } = await supabase.storage
          .from('direct-media')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw new Error('تعذّر رفع الملف');
        attachment = { path, name: file.name.slice(0, 160), kind: type.kind, size: file.size };
      }
      let sent: DirectMessage;
      try {
        sent = await sendDirectMessage(id, body, attachment);
      } catch (issue) {
        if (attachment) await supabase.storage.from('direct-media').remove([attachment.path]);
        throw issue;
      }
      setThread((c) =>
        c && selectedRef.current === id
          ? { ...c, messages: c.messages.some((m) => m.id === sent.id) ? c.messages : [...c.messages, sent] }
          : c
      );
      setBody('');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      void refreshInbox();
      router.refresh();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'تعذّر الإرسال');
    } finally {
      setBusy(false);
    }
  };

  const peer = thread?.peer || inbox.conversations.find((c) => c.id === selectedId)?.peer;

  const filteredConversations = searchQuery.trim()
    ? inbox.conversations.filter((c) =>
        displayName(c.peer).toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : inbox.conversations;

  return (
    <div className={styles.shell}>
      {/* ============ Inbox ============ */}
      <aside className={`${styles.inbox} ${selectedId ? styles.hideMobile : ''}`}>
        <div className={styles.inboxHeader}>
          <h2>الرسائل</h2>
          <span className={styles.inboxCount}>{inbox.total}</span>
        </div>

        <div className={styles.inboxSearch}>
          <ChatIcon name="search" size={15} />
          <input
            type="text"
            placeholder="ابحث…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.inboxList}>
          {filteredConversations.length ? (
            filteredConversations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectThread(item.id)}
                className={`${styles.convRow} ${selectedId === item.id ? styles.convActive : ''}`}
              >
                <Avatar name={displayName(item.peer)} src={item.peer.avatar_url} />
                <div className={styles.convBody}>
                  <div className={styles.convTop}>
                    <strong>{displayName(item.peer)}</strong>
                    {item.last_message_at && (
                      <span className={styles.convTime}>{relativeTime(item.last_message_at)}</span>
                    )}
                  </div>
                  <div className={styles.convBottom}>
                    <span className={styles.convPreview}>
                      {item.last_message_preview || 'ابدأ الحديث'}
                    </span>
                    {item.unread_count > 0 && <b className={styles.unread}>{item.unread_count}</b>}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className={styles.inboxEmpty}>
              <ChatIcon name="comment" size={28} />
              <p>{searchQuery ? 'لا نتائج' : 'لا محادثات بعد'}</p>
              {!searchQuery && (
                <Link href="/community/members" className={styles.inboxEmptyBtn}>
                  اكتشف الأعضاء
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ============ Thread ============ */}
      <section className={`${styles.thread} ${!selectedId ? styles.hideMobile : ''}`}>
        {selectedId && peer ? (
          <>
            {/* رأس المحادثة */}
            <header className={styles.threadHeader}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => {
                  setSelectedId(null);
                  setThread(null);
                  window.history.replaceState(null, '', '/community/messages');
                }}
                aria-label="رجوع"
              >
                <ChatIcon name="back" size={18} />
              </button>

              <Avatar name={displayName(peer)} src={peer.avatar_url} />

              <div className={styles.threadPeer}>
                <strong>{displayName(peer)}</strong>
                <small>{peer.community_role === 'writer' ? 'كاتب' : 'قارئ'}</small>
              </div>

              <div className={styles.threadActions}>
                {peer.username && (
                  <Link
                    href={`/community/user/${encodeURIComponent(peer.username)}`}
                    className={styles.threadIcon}
                    title="عرض الملف"
                  >
                    <ChatIcon name="eye" size={18} />
                  </Link>
                )}
                <button
                  type="button"
                  className={`${styles.threadIcon} ${styles.threadIconDanger}`}
                  onClick={() => void clearThread()}
                  disabled={clearing}
                  title="حذف المحادثة"
                >
                  <ChatIcon name="trash" size={18} />
                </button>
              </div>
            </header>

            {/* قائمة الرسائل */}
            <div className={styles.messages} ref={scrollRef}>
              {thread?.nextCursor && (
                <button className={styles.loadMore} onClick={loadMoreMessages}>
                  تحميل رسائل أقدم
                </button>
              )}

              {!thread ? (
                <p className={styles.stateMsg}>جارٍ التحميل…</p>
              ) : thread.messages.length === 0 ? (
                <div className={styles.welcome}>
                  <div className={styles.welcomeAvatar}>
                    <Avatar name={displayName(peer)} src={peer.avatar_url} size={80} />
                  </div>
                  <h3>{displayName(peer)}</h3>
                  <p>ابدأ محادثتكما الآن</p>
                </div>
              ) : (
                thread.messages.map((message, idx) => {
                  const isMine = message.sender_id === userId;
                  const prev = thread.messages[idx - 1];
                  const showTail = !prev || prev.sender_id !== message.sender_id;
                  return (
                    <article
                      key={message.id}
                      className={`${styles.bubble} ${isMine ? styles.mine : styles.theirs} ${showTail ? styles.tail : ''}`}
                    >
                      <MessageAttachment message={message} />
                      {message.body && <p className={styles.bubbleText}>{message.body}</p>}
                      <span className={styles.bubbleTime}>{time(message.created_at)}</span>
                    </article>
                  );
                })
              )}
            </div>

            {/* شريط الكتابة */}
            <form className={styles.composer} onSubmit={send}>
              {(file || recording || error) && (
                <div className={styles.composerStatus}>
                  {file && (
                    <span className={styles.chip}>
                      <ChatIcon name="paperclip" size={13} />
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          if (inputRef.current) inputRef.current.value = '';
                        }}
                        aria-label="إزالة"
                      >
                        <ChatIcon name="close" size={12} />
                      </button>
                    </span>
                  )}
                  {recording && (
                    <span className={`${styles.chip} ${styles.chipRecord}`}>
                      <span className={styles.dot} /> جارٍ التسجيل…
                    </span>
                  )}
                  {error && <span className={styles.error}>{error}</span>}
                </div>
              )}

              <div className={styles.composerBar}>
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setError('');
                  }}
                />

                <div className={styles.emojiWrap}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => setShowEmojis((v) => !v)}
                    aria-label="إيموجي"
                  >
                    <ChatIcon name="emoji" size={22} />
                  </button>
                  {showEmojis && (
                    <div className={styles.emojiPopover}>
                      <EmojiPicker
                        onSelect={(emoji) => setBody((v) => v + emoji)}
                        onClose={() => setShowEmojis(false)}
                      />
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  className={styles.textInput}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="اكتب رسالة…"
                  maxLength={5000}
                  aria-label="نص الرسالة"
                />

                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => inputRef.current?.click()}
                  aria-label="إرفاق ملف"
                >
                  <ChatIcon name="paperclip" size={22} />
                </button>

                {body.trim() || file ? (
                  <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={busy || recording}
                    aria-label="إرسال"
                  >
                    {busy ? <span className={styles.spin} /> : <ChatIcon name="send" size={18} />}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={toggleRecording}
                    aria-label={recording ? 'إيقاف' : 'تسجيل صوتي'}
                  >
                    {recording ? <ChatIcon name="stop" size={20} /> : <ChatIcon name="mic" size={22} />}
                  </button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyCircle}>
              <ChatIcon name="send" size={42} />
            </div>
            <h2>رسائلك</h2>
            <p>أرسل رسائل خاصة لأصدقائك في عُروبة.</p>
            <Link href="/community/members" className={styles.emptyBtn}>
              اكتشف الأعضاء
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}