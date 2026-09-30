import assert from 'node:assert/strict';
import test from 'node:test';
import mammoth from 'mammoth';
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
