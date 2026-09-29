"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { defaultReaderSettings, type ReaderSettings, type Bookmark, type Highlight } from '@/lib/reader';
import { getReaderState, saveReaderSettings, saveReadingProgress } from '@/app/reader/actions';

export function useReaderState(chapterId: string, novelId: string) {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(defaultReaderSettings);
  const [position, setPosition] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [status, setStatus] = useState('جارٍ استعادة موضع القراءة…');
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const page = useRef(1);

  useEffect(() => {
    let active = true;
    let currentId: string | null | undefined;
    const load = async (id: string | null) => {
      if (!active || currentId === id) return;
      currentId = id;
      const version = ++generation.current;
      setReady(false);
      setCloudReady(false);
      setUserId(id);
      setBookmarks([]);
      setHighlights([]);
      setSettings(defaultReaderSettings);
      setPosition(0);
      setStatus('جارٍ استعادة موضع القراءة…');

      if (!id) {
        try {
          const saved = JSON.parse(localStorage.getItem(`arooba:reader:guest:${chapterId}`) || 'null');
          if (Number.isInteger(saved?.position) && saved.position >= 0) setPosition(saved.position);
          const prefs = JSON.parse(localStorage.getItem('arooba:reader:guest:settings') || 'null');
          if (prefs && ['small', 'medium', 'large'].includes(prefs.font_size) &&
              ['Cairo', 'Amiri', 'sans-serif'].includes(prefs.font_family) &&
              ['light', 'dark', 'sepia'].includes(prefs.theme) &&
              Number.isFinite(prefs.brightness) && prefs.brightness >= 40 && prefs.brightness <= 100)
            setSettings(prefs);
        } catch {}
        setStatus('حفظ محلي على هذا الجهاز. سجّل الدخول لمزامنة الفواصل.');
        setReady(true);
        return;
      }

      try {
        const saved = await getReaderState(chapterId, id);
        if (!active || generation.current !== version) return;
        setSettings(saved.settings || defaultReaderSettings);
        setPosition(saved.progress?.position || 0);
        setBookmarks(saved.bookmarks);
        setHighlights(saved.highlights);
        setCloudReady(true);
        setStatus(saved.progress ? 'تمت استعادة موضع القراءة' : 'تتم مزامنة القراءة');
      } catch (error) {
        if (active && generation.current === version)
          setStatus(error instanceof Error ? error.message : 'المزامنة غير متاحة حالياً');
      } finally {
        if (active && generation.current === version) setReady(true);
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session?.user.id || null);
    });
    void supabase.auth.getSession()
      .then(({ data }) => { if (currentId === undefined) void load(data.session?.user.id || null); })
      .catch(() => { if (currentId === undefined) void load(null); });
    return () => { active = false; generation.current++; subscription.unsubscribe(); };
  }, [chapterId, retry]);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      try { localStorage.setItem(`arooba:reader:guest:${chapterId}`, JSON.stringify({ position })); } catch {}
      return;
    }
    if (!cloudReady) return;
    const version = generation.current;
    const timer = setTimeout(() => {
      queue.current = queue.current.catch(() => {}).then(async () => {
        if (generation.current !== version) return;
        try {
          await saveReadingProgress({ chapterId, novelId, position, page: page.current }, userId);
          if (generation.current === version) setStatus('تم حفظ موضع القراءة');
        } catch (error) {
          if (generation.current === version)
            setStatus(error instanceof Error ? error.message : 'تعذر حفظ التقدم');
        }
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [chapterId, novelId, userId, ready, cloudReady, position]);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      try { localStorage.setItem('arooba:reader:guest:settings', JSON.stringify(settings)); } catch {}
      return;
    }
    if (!cloudReady) return;
    const version = generation.current;
    const timer = setTimeout(() => {
      queue.current = queue.current.catch(() => {}).then(async () => {
        if (generation.current !== version) return;
        try { await saveReaderSettings(settings, userId); }
        catch (error) {
          if (generation.current === version)
            setStatus(error instanceof Error ? error.message : 'تعذر حفظ إعدادات القراءة');
        }
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [settings, userId, ready, cloudReady]);

  async function mutate<T>(action: (id: string) => Promise<T>, apply: (result: T) => void) {
    if (!userId) throw new Error('سجّل الدخول لحفظ الفواصل والتظليلات.');
    if (!cloudReady) throw new Error('المزامنة غير متاحة. أعد المحاولة أولاً.');
    const version = generation.current;
    const result = await action(userId);
    if (generation.current === version) apply(result);
  }

  return {
    userId, ready, cloudReady, settings, setSettings,
    position, setPosition, bookmarks, setBookmarks,
    highlights, setHighlights, status, page, mutate,
    retry: () => setRetry(v => v + 1),
  };
}
