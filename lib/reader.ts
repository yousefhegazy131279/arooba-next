export type ReaderSettings = {
  font_size: 'small' | 'medium' | 'large';
  font_family: 'Cairo' | 'Amiri' | 'sans-serif';
  theme: 'light' | 'dark' | 'sepia';
  brightness: number;
};
export const defaultReaderSettings: ReaderSettings = { font_size: 'medium', font_family: 'Amiri', theme: 'sepia', brightness: 100 };
export type ReaderPage = { text: string; start: number; end: number };
export type Bookmark = { id: string; page_number: number; position: number; note: string | null };
export type Highlight = { id: string; text: string; color: 'yellow' | 'green' | 'blue' | 'pink'; start_offset: number; end_offset: number };
export type ReaderState = {
  settings: ReaderSettings | null;
  progress: { position: number; page_number: number } | null;
  bookmarks: Bookmark[];
  highlights: Highlight[];
};

/** Canonical, safe text. Stored offsets use these UTF-16 indices on server and client. */
export function normalizeReaderContent(content: string): string {
  const plain = content
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (entity, key: string) => {
      const named: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
      if (!key.startsWith('#')) return named[key.toLowerCase()] ?? entity;
      const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '\uFFFD';
    });
  return plain.replace(/\r\n?/g, '\n').trim();
}

/** Preserve every character and never break words; unusually long words scroll/wrap in the UI. */
export function paginateContent(content: string, charsPerPage: number): ReaderPage[] {
  if (!Number.isFinite(charsPerPage) || charsPerPage < 1) throw new RangeError('charsPerPage must be positive');
  if (!content) return [{ text: '', start: 0, end: 0 }];
  const limit = Math.floor(charsPerPage);
  const pages: ReaderPage[] = [];
  let start = 0;
  let end = 0;
  for (const match of content.matchAll(/\S+\s*|\s+/gu)) {
    const tokenEnd = (match.index ?? 0) + match[0].length;
    if (end > start && tokenEnd - start > limit) {
      pages.push({ text: content.slice(start, end), start, end });
      start = end;
    }
    end = tokenEnd;
  }
  if (end > start) pages.push({ text: content.slice(start, end), start, end });
  return pages;
}
export function splitContentIntoPages(content: string, charsPerPage: number): string[] {
  return paginateContent(content, charsPerPage).map(page => page.text);
}
export function pageForPosition(pages: ReaderPage[], position: number): number {
  if (!Number.isFinite(position) || position <= 0) return 0;
  const index = pages.findIndex(page => position < page.end);
  return index === -1 ? Math.max(0, pages.length - 1) : index;
}
export function searchChapter(content: string, query: string): { start: number; end: number }[] {
  const needle = query.trim();
  if (!needle) return [];
  // Escape literal input; regex match indices stay correct when Unicode case folding changes length.
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...content.matchAll(new RegExp(escaped, 'giu'))].map(match => ({ start: match.index!, end: match.index! + match[0].length }));
}
