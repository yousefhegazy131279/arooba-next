export type PdfSearchIndex = { fileUrl: string; pages: string[] };

/** Compare Arabic queries despite common hamza, diacritic, and spacing differences. */
export function normalizePdfSearch(value: string): string {
  return value.normalize('NFKC')
    .toLocaleLowerCase('ar')
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validPdfSearchIndex(value: unknown, fileUrl: string, total: number): value is PdfSearchIndex {
  if (!value || typeof value !== 'object') return false;
  const index = value as Partial<PdfSearchIndex>;
  return index.fileUrl === fileUrl &&
    Array.isArray(index.pages) &&
    index.pages.length === total &&
    index.pages.every(page => typeof page === 'string');
}

export function nextPdfMatch(pages: readonly string[], query: string, current: number): number | null {
  const needle = normalizePdfSearch(query);
  if (!needle || pages.length === 0) return null;
  for (let step = 1; step <= pages.length; step++) {
    const index = (current + step) % pages.length;
    if (normalizePdfSearch(pages[index]).includes(needle)) return index;
  }
  return null;
}
