'use client';
/* eslint-disable @next/next/no-img-element -- Private signed attachment URLs expire and have unknown dimensions. */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDirectAttachmentUrl, getDirectInbox, getDirectMessagePage, markDirectMessagesRead, sendDirectMessage } from '@/app/community/social/actions';
import { supabase } from '@/lib/supabaseClient';
import type { DirectAttachment, DirectAttachmentKind, DirectConversation, DirectMessage, DirectMessagePage, SocialMember } from '@/lib/social-types';
import Avatar from './Avatar';
import styles from './Social.module.css';

type Thread = DirectMessagePage & { peer: SocialMember };
const emojis = ['😊', '❤️', '👏', '📚', '✨', '😂', '🥰', '👍', '🤔', '🔥', '🙏', '🎉'];
const acceptedTypes: Record<string, { kind: DirectAttachmentKind; ext: string }> = {
  'image/jpeg': { kind: 'image', ext: 'jpg' }, 'image/png': { kind: 'image', ext: 'png' },
  'image/webp': { kind: 'image', ext: 'webp' }, 'image/gif': { kind: 'image', ext: 'gif' },
  'video/mp4': { kind: 'video', ext: 'mp4' }, 'video/webm': { kind: 'video', ext: 'webm' },
  'application/pdf': { kind: 'pdf', ext: 'pdf' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { kind: 'docx', ext: 'docx' },
  'audio/webm': { kind: 'voice', ext: 'webm' }, 'audio/mp4': { kind: 'voice', ext: 'mp4' },
  'audio/ogg': { kind: 'voice', ext: 'ogg' }, 'audio/mpeg': { kind: 'voice', ext: 'mp3' },
};
const maxFileSize = 40 * 1024 * 1024;
function displayName(member: SocialMember) { return member.full_name || member.username || 'عضو عُروبة'; }
function time(value: string) { return new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }

function MessageAttachment({ message }: { message: DirectMessage }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!message.attachment_path) return;
    let active = true;
    getDirectAttachmentUrl(message.id).then(value => { if (active) setUrl(value); }).catch(() => { if (active) setError('تعذّر فتح المرفق'); });
    return () => { active = false; };
  }, [message.id, message.attachment_path]);
  if (!message.attachment_path) return null;
  if (error) return <span className={styles.error}>{error}</span>;
  if (!url) return <span className={styles.subtle}>جارٍ تحميل المرفق…</span>;
  const name = message.attachment_name || 'مرفق';
  if (message.attachment_kind === 'image') return <a href={url} target="_blank" rel="noopener noreferrer"><img className={styles.messageImage} src={url} alt={name} /></a>;
  if (message.attachment_kind === 'video') return <video className={styles.messageVideo} controls preload="metadata" src={url} />;
  if (message.attachment_kind === 'voice') return <div className={styles.voiceMessage}><span>🎙 رسالة صوتية</span><audio controls preload="metadata" src={url} /></div>;
  return <a className={styles.documentLink} href={url} target="_blank" rel="noopener noreferrer" download={name}>📄 {name} <small>{message.attachment_kind === 'pdf' ? 'PDF' : 'Word'}</small></a>;
}

export default function DirectMessages({ userId, initialInbox, initialSelectedId, initialThread }: { userId: string; initialInbox: { conversations: DirectConversation[]; total: number }; initialSelectedId: string | null; initialThread: Thread | null }) {
  const [inbox, setInbox] = useState(initialInbox);
  const [inboxPage, setInboxPage] = useState(0);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [thread, setThread] = useState<Thread | null>(initialThread);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
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
      const pages = await Promise.all(Array.from({ length: inboxPage + 1 }, (_, index) => getDirectInbox(index)));
      const unique = new Map<string, DirectConversation>();
      pages.forEach(page => page.conversations.forEach(item => unique.set(item.id, item)));
      setInbox({ conversations: [...unique.values()], total: pages[0].total });
    } catch { /* Existing inbox remains visible. */ }
  }, [inboxPage]);
  const refreshThread = useCallback(async (id: string) => {
    try {
      const result = await getDirectMessagePage(id);
      if (selectedRef.current === id) { setThread(result); await markDirectMessagesRead(id); void refreshInbox(); }
    } catch (issue) { if (selectedRef.current === id) setError(issue instanceof Error ? issue.message : 'تعذّر تحميل المحادثة'); }
  }, [refreshInbox]);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (selectedId && !initialThread) void refreshThread(selectedId);
    if (selectedId && initialThread) void markDirectMessagesRead(selectedId).then(refreshInbox).catch(() => {});
  }, [selectedId, initialThread, refreshThread, refreshInbox]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [thread?.messages.length, selectedId]);
  useEffect(() => {
    const channel = supabase.channel(`dm-page-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `recipient_id=eq.${userId}` }, payload => {
        void refreshInbox();
        const row = payload.new as DirectMessage;
        if (row.conversation_id === selectedRef.current) void refreshThread(row.conversation_id);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages', filter: `sender_id=eq.${userId}` }, payload => {
        const row = payload.new as DirectMessage;
        if (row.conversation_id === selectedRef.current) setThread(current => current ? { ...current, messages: current.messages.map(item => item.id === row.id ? { ...item, is_read: row.is_read } : item) } : current);
      }).subscribe();
    const fallback = window.setInterval(() => { void refreshInbox(); if (selectedRef.current) void refreshThread(selectedRef.current); }, 25000);
    return () => { window.clearInterval(fallback); void supabase.removeChannel(channel); };
  }, [userId, refreshInbox, refreshThread]);
  useEffect(() => () => { recorderRef.current?.stop(); streamRef.current?.getTracks().forEach(track => track.stop()); }, []);

  const selectThread = (id: string) => {
    if (id === selectedId) return;
    selectedRef.current = id;
    if (recording) { recorderRef.current?.stop(); setRecording(false); }
    setSelectedId(id); setThread(null); setError(''); setFile(null); setBody('');
    window.history.replaceState(null, '', `/community/messages?thread=${id}`);
    void refreshThread(id);
  };
  const loadMoreMessages = () => {
    if (!selectedId || !thread?.nextCursor) return;
    const id = selectedId, cursor = thread.nextCursor;
    startTransition(async () => {
      try {
        const older = await getDirectMessagePage(id, cursor);
        if (selectedRef.current === id) setThread(current => current ? { ...current, messages: [...older.messages, ...current.messages], nextCursor: older.nextCursor } : current);
      } catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذّر تحميل الرسائل الأقدم'); }
    });
  };
  const toggleRecording = async () => {
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('التسجيل الصوتي غير مدعوم في هذا المتصفح'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm', 'audio/mp4', 'audio/ogg'].find(type => MediaRecorder.isTypeSupported(type));
      if (!mime) { stream.getTracks().forEach(track => track.stop()); throw new Error('صيغة التسجيل غير مدعومة'); }
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const recordingId = selectedRef.current;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop()); streamRef.current = null;
        const blob = new Blob(chunks, { type: mime });
        if (blob.size && recordingId === selectedRef.current) setFile(new File([blob], `رسالة-صوتية.${acceptedTypes[mime].ext}`, { type: mime }));
      };
      recorderRef.current = recorder; streamRef.current = stream; recorder.start(); setRecording(true); setError('');
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذّر الوصول إلى الميكروفون'); }
  };
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || busy || (!body.trim() && !file)) return;
    const id = selectedId;
    let attachment: DirectAttachment | null = null;
    setBusy(true); setError('');
    try {
      if (file) {
        const type = acceptedTypes[file.type];
        if (!type) throw new Error('صيغة الملف غير مدعومة. اختر صورة، فيديو، PDF، Word أو رسالة صوتية.');
        if (!file.size) throw new Error('الملف فارغ');
        if (file.size > maxFileSize) throw new Error('حجم الملف يتجاوز 40 ميغابايت');
        const path = `${id}/${userId}/${crypto.randomUUID()}.${type.ext}`;
        const { error: uploadError } = await supabase.storage.from('direct-media').upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error('تعذّر رفع الملف');
        attachment = { path, name: file.name.slice(0, 160), kind: type.kind, size: file.size };
      }
      let sent: DirectMessage;
      try { sent = await sendDirectMessage(id, body, attachment); }
      catch (issue) {
        if (attachment) await supabase.storage.from('direct-media').remove([attachment.path]);
        throw issue;
      }
      setThread(current => current && selectedRef.current === id ? { ...current, messages: current.messages.some(item => item.id === sent.id) ? current.messages : [...current.messages, sent] } : current);
      setBody(''); setFile(null); if (inputRef.current) inputRef.current.value = '';
      void refreshInbox(); router.refresh();
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذّر إرسال الرسالة'); }
    finally { setBusy(false); }
  };
  const peer = thread?.peer || inbox.conversations.find(item => item.id === selectedId)?.peer;
  return <div className={styles.messagesShell}>
    <header className={styles.messagesTitle}><div><span className={styles.role}>مجتمع عُروبة</span><h1>الرسائل الخاصة</h1><p>حديثك مع القرّاء والكتّاب في مكان واحد.</p></div><Link className={styles.outlineButton} href="/community/members">اكتشف الأعضاء</Link></header>
    <div className={styles.messagesLayout}>
      <aside className={`${styles.inboxPanel} ${selectedId ? styles.mobileHide : ''}`} aria-label="المحادثات"><div className={styles.panelHeading}><h2>المحادثات</h2><span>{inbox.total}</span></div>
        {inbox.conversations.length ? inbox.conversations.map(item => <button type="button" key={item.id} onClick={() => selectThread(item.id)} className={`${styles.conversationRow} ${selectedId === item.id ? styles.activeConversation : ''}`} aria-current={selectedId === item.id ? 'true' : undefined}>
          <Avatar name={displayName(item.peer)} src={item.peer.avatar_url} /><span className={styles.conversationInfo}><strong>{displayName(item.peer)}</strong><small>{item.last_message_preview || 'ابدأ الحديث'}</small></span>{item.unread_count > 0 && <b className={styles.unreadCount}>{item.unread_count}</b>}
        </button>) : <div className={styles.empty}>لا محادثات بعد. اختر عضوًا من دليل المجتمع وابدأ الحديث.</div>}
        {inbox.total > inbox.conversations.length && <button className={styles.loadMore} onClick={async () => { const next = inboxPage + 1; try { const older = await getDirectInbox(next); setInbox(current => ({ total: older.total, conversations: [...current.conversations, ...older.conversations.filter(item => !current.conversations.some(existing => existing.id === item.id))] })); setInboxPage(next); } catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذّر تحميل المحادثات'); } }}>محادثات أقدم</button>}
      </aside>
      <section className={`${styles.threadPanel} ${!selectedId ? styles.mobileHide : ''}`} aria-label="المحادثة">
        {selectedId && peer ? <><header className={styles.threadHeader}><button type="button" className={styles.backButton} onClick={() => { setSelectedId(null); setThread(null); window.history.replaceState(null, '', '/community/messages'); }} aria-label="العودة إلى المحادثات">→</button><Avatar name={displayName(peer)} src={peer.avatar_url} /><div><strong>{displayName(peer)}</strong><small>{peer.community_role === 'writer' ? 'كاتب' : 'قارئ'}</small></div>{peer.username && <Link href={`/community/user/${encodeURIComponent(peer.username)}`} className={styles.profileLink}>عرض الملف</Link>}</header>
          <div className={styles.messageList} ref={scrollRef} aria-live="polite">{thread?.nextCursor && <button className={styles.loadMore} disabled={pending} onClick={loadMoreMessages}>رسائل أقدم</button>}{!thread ? <p className={styles.empty}>جارٍ تحميل المحادثة…</p> : thread.messages.length === 0 ? <p className={styles.empty}>ابدأ برسالة لطيفة عن كتاب أو قصة تحبها 📚</p> : thread.messages.map(message => <article key={message.id} className={`${styles.messageBubble} ${message.sender_id === userId ? styles.myMessage : styles.theirMessage}`}><MessageAttachment message={message} />{message.body && <p>{message.body}</p>}<footer><time dateTime={message.created_at}>{time(message.created_at)}</time>{message.sender_id === userId && <span>{message.is_read ? '✓✓ تمت القراءة' : '✓ أُرسلت'}</span>}</footer></article>)}</div>
          <form className={styles.composer} onSubmit={send}><div className={styles.composerTop}>{file && <span className={styles.selectedFile}>📎 {file.name} <button type="button" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }}>×</button></span>}{recording && <span className={styles.recording}>● جارٍ تسجيل رسالة صوتية…</span>}{error && <span role="alert" className={styles.error}>{error}</span>}</div><div className={styles.composerRow}><input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => { setFile(event.target.files?.[0] || null); setError(''); }} /><button type="button" className={styles.toolButton} onClick={() => inputRef.current?.click()} aria-label="إرفاق ملف" title="صورة، فيديو، PDF أو Word">📎</button><button type="button" className={`${styles.toolButton} ${recording ? styles.recordingButton : ''}`} onClick={toggleRecording} aria-label={recording ? 'إيقاف التسجيل' : 'تسجيل رسالة صوتية'} title={recording ? 'إيقاف التسجيل' : 'رسالة صوتية'}>{recording ? '■' : '🎙'}</button><div className={styles.emojiWrap}><button type="button" className={styles.toolButton} onClick={() => setShowEmojis(value => !value)} aria-label="إضافة رمز تعبيري">😊</button>{showEmojis && <div className={styles.emojiPicker}>{emojis.map(emoji => <button type="button" key={emoji} onClick={() => { setBody(value => value + emoji); setShowEmojis(false); }}>{emoji}</button>)}</div>}</div><textarea value={body} onChange={event => setBody(event.target.value)} maxLength={5000} rows={1} placeholder="اكتب رسالة…" aria-label="نص الرسالة" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button className={styles.sendButton} type="submit" disabled={busy || recording || (!body.trim() && !file)}>{busy ? 'جارٍ الإرسال' : 'إرسال'}</button></div></form>
        </> : <div className={styles.threadEmpty}><span>✉</span><h2>حديث جديد يبدأ هنا</h2><p>اختر محادثة أو تعرّف إلى عضو جديد من المجتمع.</p><Link href="/community/members" className={styles.primaryButton}>اكتشف الأعضاء</Link></div>}
      </section>
    </div>
  </div>;
}
