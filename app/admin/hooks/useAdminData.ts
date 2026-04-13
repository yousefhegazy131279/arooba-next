"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUsers,
  updateUserRole,
  deleteUser,
  getNovels,
  createNovel,
  updateNovel,
  deleteNovel,
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  getSuggestions,
  deleteSuggestion,
  getMessages,
  updateMessageStatus,
  deleteMessage,
  uploadCover,
  uploadChapterFile,
  uploadChapterImage,
} from "../actions";

export type Novel = {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  cover: string;
  chapters_count: number;
  created_at?: string;
};

export type Chapter = {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_file: string | null;
  image: string | null;
};

export type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
};

export type Suggestion = {
  id: number;
  name: string;
  story_title: string;
  comment: string;
  created_at: string;
};

export type Message = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  created_at: string;
};

export function useAdminData() {
  // بيانات الاقتراحات
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // بيانات الرسائل
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // بيانات الروايات
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loadingNovels, setLoadingNovels] = useState(false);

  // بيانات المستخدمين
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // دوال الاقتراحات
  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const data = await getSuggestions();
      setSuggestions(data);
    } catch (err: any) {
      console.error(err);
      alert("فشل تحميل الاقتراحات: " + err.message);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const deleteSuggestionById = useCallback(async (id: number) => {
    try {
      await deleteSuggestion(id);
      setSuggestions(prev => prev.filter(s => s.id !== id));
      alert("تم حذف الاقتراح بنجاح");
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  }, []);

  // دوال الرسائل
  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (err: any) {
      alert("فشل تحميل الرسائل: " + err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const updateMessageStatusById = useCallback(async (id: number, status: string) => {
    try {
      await updateMessageStatus(id, status);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: status as any } : m));
    } catch (err: any) {
      alert("فشل تحديث الحالة: " + err.message);
    }
  }, []);

  const deleteMessageById = useCallback(async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    try {
      await deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      alert("تم حذف الرسالة بنجاح");
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  }, []);

  // دوال الروايات
  const fetchNovels = useCallback(async () => {
    setLoadingNovels(true);
    try {
      const data = await getNovels();
      setNovels(data);
    } catch (err: any) {
      alert("فشل تحميل الروايات: " + err.message);
    } finally {
      setLoadingNovels(false);
    }
  }, []);

  const createNovelAction = useCallback(async (novelData: Omit<Novel, 'id' | 'created_at'>, coverFile?: File) => {
    try {
      let coverUrl = novelData.cover;
      if (coverFile) {
        const uploaded = await uploadCover(coverFile);
        if (uploaded) coverUrl = uploaded;
        else if (uploaded === null) coverUrl = "";
        else throw new Error("فشل رفع الصورة");
      }
      const newNovel = { ...novelData, cover: coverUrl };
      await createNovel(newNovel);
      alert("تم إضافة الرواية بنجاح");
      await fetchNovels();
    } catch (err: any) {
      alert("فشل إضافة الرواية: " + err.message);
    }
  }, [fetchNovels]);

  const updateNovelAction = useCallback(async (id: string, novelData: Partial<Novel>, coverFile?: File) => {
    try {
      let coverUrl = novelData.cover;
      if (coverFile) {
        const uploaded = await uploadCover(coverFile);
        if (uploaded) coverUrl = uploaded;
      }
      const updatedData = { ...novelData, cover: coverUrl };
      await updateNovel(id, updatedData);
      alert("تم تحديث الرواية بنجاح");
      await fetchNovels();
    } catch (err: any) {
      alert("فشل تحديث الرواية: " + err.message);
    }
  }, [fetchNovels]);

  const deleteNovelById = useCallback(async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرواية؟ سيتم حذف جميع فصولها أيضاً.")) return;
    try {
      await deleteNovel(id);
      alert("تم حذف الرواية بنجاح");
      await fetchNovels();
    } catch (err: any) {
      alert("فشل حذف الرواية: " + err.message);
    }
  }, [fetchNovels]);

  // دوال الفصول (تستخدم داخل NovelsTab)
  const fetchChapters = useCallback(async (novelId: string): Promise<Chapter[]> => {
    try {
      return await getChapters(novelId);
    } catch (err: any) {
      alert("فشل تحميل الفصول: " + err.message);
      return [];
    }
  }, []);

  const createChapterAction = useCallback(async (chapterData: Omit<Chapter, 'id'>, file?: File, image?: File) => {
    try {
      let fileUrl = null, imageUrl = null;
      if (file) {
        const uploaded = await uploadChapterFile(file);
        if (uploaded) fileUrl = uploaded;
        else if (uploaded === null) fileUrl = null;
        else throw new Error("فشل رفع الملف");
      }
      if (image) {
        const uploaded = await uploadChapterImage(image);
        if (uploaded) imageUrl = uploaded;
      }
      const newChapter = { ...chapterData, word_file: fileUrl, image: imageUrl };
      await createChapter(newChapter);
      alert("تم إضافة الفصل بنجاح");
    } catch (err: any) {
      alert("فشل إضافة الفصل: " + err.message);
    }
  }, []);

  const updateChapterAction = useCallback(async (id: string, chapterData: Partial<Chapter>, file?: File, image?: File) => {
    try {
      let fileUrl = chapterData.word_file;
      let imageUrl = chapterData.image;
      if (file) {
        const uploaded = await uploadChapterFile(file);
        if (uploaded) fileUrl = uploaded;
      }
      if (image) {
        const uploaded = await uploadChapterImage(image);
        if (uploaded) imageUrl = uploaded;
      }
      const updatedData = { ...chapterData, word_file: fileUrl, image: imageUrl };
      await updateChapter(id, updatedData);
      alert("تم تحديث الفصل بنجاح");
    } catch (err: any) {
      alert("فشل تحديث الفصل: " + err.message);
    }
  }, []);

  const deleteChapterById = useCallback(async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفصل؟")) return;
    try {
      await deleteChapter(id);
      alert("تم حذف الفصل بنجاح");
    } catch (err: any) {
      alert("فشل حذف الفصل: " + err.message);
    }
  }, []);

  // دوال المستخدمين
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      alert("فشل تحميل المستخدمين: " + err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const updateUserRoleAction = useCallback(async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert("تم تحديث الدور بنجاح");
    } catch (err: any) {
      alert("فشل تحديث الدور: " + err.message);
    }
  }, []);

  const deleteUserById = useCallback(async (userId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert("تم حذف المستخدم بنجاح");
    } catch (err: any) {
      alert("فشل حذف المستخدم: " + err.message);
    }
  }, []);

  // جلب كل البيانات مرة واحدة (للإحصائيات)
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchSuggestions(),
      fetchMessages(),
      fetchNovels(),
      fetchUsers(),
    ]);
  }, [fetchSuggestions, fetchMessages, fetchNovels, fetchUsers]);

  return {
    // اقتراحات
    suggestions,
    loadingSuggestions,
    fetchSuggestions,
    deleteSuggestionById,
    // رسائل
    messages,
    loadingMessages,
    fetchMessages,
    updateMessageStatusById,
    deleteMessageById,
    // روايات
    novels,
    loadingNovels,
    fetchNovels,
    createNovelAction,
    updateNovelAction,
    deleteNovelById,
    // فصول
    fetchChapters,
    createChapterAction,
    updateChapterAction,
    deleteChapterById,
    // مستخدمين
    users,
    loadingUsers,
    fetchUsers,
    updateUserRoleAction,
    deleteUserById,
    // شامل
    fetchAllData,
  };
}