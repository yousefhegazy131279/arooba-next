import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReaderContent, paginateContent, pageForPosition, searchChapter, splitContentIntoPages } from './reader';

test('pagination preserves Arabic text, whitespace and long words without truncation', () => {
  const source = 'أول فقرة.\n\nثاني فقرة فيها ' + 'ط'.repeat(120) + ' ثم النهاية';
  const pages = paginateContent(source, 20);
  assert.equal(pages.map(page => page.text).join(''), source);
  assert.ok(pages.some(page => page.text.includes('ط'.repeat(120))));
  for (const page of pages) assert.equal(source.slice(page.start, page.end), page.text);
  assert.deepEqual(splitContentIntoPages('', 20), ['']);
  assert.throws(() => paginateContent('word', 0), RangeError);
});
test('saved offsets survive font and viewport repagination, including boundaries', () => {
  const source = 'واحد اثنان ثلاثة أربعة خمسة ستة سبعة ثمانية';
  const initial = paginateContent(source, 12);
  const position = initial[2].start;
  const resized = paginateContent(source, 25);
  const page = resized[pageForPosition(resized, position)];
  assert.ok(position >= page.start && position < page.end);
  assert.equal(pageForPosition(initial, initial[1].start), 1);
  assert.equal(pageForPosition(initial, 1e6), initial.length - 1);
});
test('search is literal, case insensitive and preserves source offsets', () => {
  assert.deepEqual(searchChapter('عُروبة ثم عُروبة', 'عُروبة'), [{ start: 0, end: 6 }, { start: 10, end: 16 }]);
  assert.deepEqual(searchChapter('a.b A.B [x]', 'a.b'), [{ start: 0, end: 3 }, { start: 4, end: 7 }]);
  assert.deepEqual(searchChapter('abc', '  '), []);
});
test('HTML is converted to safe consistent text before offsets are calculated', () => {
  assert.equal(normalizeReaderContent('<p>مرحبا &amp; أهلا</p><script>alert(1)</script><p>عالم<br>جديد</p>'), 'مرحبا & أهلا\n\nعالم\nجديد');
  assert.equal(normalizeReaderContent('&#x1F30D; &#99999999;'), '🌍 �');
});
