import assert from 'node:assert/strict';
import test from 'node:test';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { makeWorkDocx, workFileName } from '../../lib/writerExport';

test('writer export produces a readable Arabic Word document with every chapter', async () => {
  const blob = await makeWorkDocx({
    title: 'حكاية النهر', description: 'نبذة عربية',
    chapters: [{ title: 'البداية', body: 'في صباح بعيد\nبدأت الحكاية.' }, { title: 'العودة', body: 'عاد البطل إلى بيته.' }],
  });
  assert.ok(blob.size > 0);
  const result = await mammoth.extractRawText({ buffer: Buffer.from(await blob.arrayBuffer()) });
  for (const text of ['حكاية النهر', 'نبذة عربية', 'البداية', 'بدأت الحكاية.', 'العودة', 'عاد البطل']) assert.ok(result.value.includes(text), text);
  assert.equal(workFileName('حكاية/النهر'), 'حكايةالنهر.docx');
});

test('writer export keeps rich headings and emphasis in Word', async () => {
  const blob = await makeWorkDocx({
    title: 'رحلة', description: '',
    chapters: [{ title: 'الفصل الأول', body: 'عنوان فرعي\nنص مميز', rich: {
      type: 'doc', content: [
        { type: 'heading', attrs: { level: 2, textAlign: 'center' }, content: [{ type: 'text', text: 'عنوان فرعي' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'نص مميز', marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { fontSize: '24px', fontFamily: 'Amiri' } }] }] },
        { type: 'pageBreak' },
        { type: 'paragraph', content: [{ type: 'text', text: 'بداية صفحة ثانية', marks: [{ type: 'italic' }] }] },
      ],
    } }],
  });
  const html = await mammoth.convertToHtml({ buffer: Buffer.from(await blob.arrayBuffer()) });
  assert.match(html.value, /<h2>عنوان فرعي<\/h2>/);
  assert.match(html.value, /<strong>نص مميز<\/strong>/);
  assert.match(html.value, /<em>بداية صفحة ثانية<\/em>/);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const documentXml = await zip.file('word/document.xml')!.async('string');
  assert.match(documentXml, /w:type="page"/);
  assert.match(documentXml, /w:bidi/);
});
