export type ExportChapter = { title: string; body: string };
export type ExportWork = { title: string; description: string; chapters: ExportChapter[] };

export async function makeWorkDocx(work: ExportWork): Promise<Blob> {
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph } = await import('docx');
  const children = [
    new Paragraph({ text: work.title.trim(), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 450 } }),
  ];
  if (work.description.trim()) children.push(new Paragraph({ text: work.description.trim(), alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 420 } }));
  for (const chapter of work.chapters) {
    children.push(new Paragraph({ text: chapter.title.trim() || 'فصل بلا عنوان', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT, bidirectional: true, pageBreakBefore: true, spacing: { after: 300 } }));
    for (const line of chapter.body.replace(/\r/g, '').split('\n')) {
      children.push(new Paragraph({ text: line || ' ', alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 160 }, indent: { firstLine: 420 } }));
    }
  }
  const document = new Document({ sections: [{ children }] });
  return Packer.toBlob(document);
}

export function workFileName(title: string) {
  return (title.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').slice(0, 90) || 'عمل-عروبة') + '.docx';
}

export function downloadWork(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
