import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nextPdfMatch, normalizePdfSearch, validPdfSearchIndex } from './pdf-search';

const index = JSON.parse(readFileSync(new URL('../public/reader-search/4.json', import.meta.url), 'utf8'));

test('the uploaded chapter has a complete OCR index tied to its source PDF', () => {
  assert.ok(validPdfSearchIndex(index, index.fileUrl, 13));
  assert.equal(validPdfSearchIndex(index, 'https://example.com/replaced.pdf', 13), false);
  assert.equal(validPdfSearchIndex({ ...index, pages: index.pages.slice(0, 12) }, index.fileUrl, 13), false);
});

test('Arabic searches find visible words and advance to the next matching page', () => {
  assert.equal(nextPdfMatch(index.pages, 'توماس', 4), 6);
  assert.equal(nextPdfMatch(index.pages, 'توماس', 6), 7);
  assert.equal(nextPdfMatch(index.pages, 'توماس', 7), 6);
  assert.equal(nextPdfMatch(index.pages, 'اسم لا يظهر في الرواية', 4), null);
  assert.equal(normalizePdfSearch('إلىٰ  مَقْهَى!'), 'الي مقهي');
});
