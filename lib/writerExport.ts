import { chapterDocument, type RichNode } from './writerDocument';

export type ExportChapter = { title: string; body: string; rich?: RichNode | null };
export type ExportWork = { title: string; description: string; chapters: ExportChapter[] };

export async function makeWorkDocx(work: ExportWork): Promise<Blob> {
  const { AlignmentType, Document, HeadingLevel, PageBreak, Packer, Paragraph, TextRun } = await import('docx');
  type ParagraphOptions = ConstructorParameters<typeof Paragraph>[0];
  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ text: work.title.trim(), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 450 } }),
  ];
  if (work.description.trim()) children.push(new Paragraph({ text: work.description.trim(), alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { after: 420 } }));

  const alignment = (value: unknown) => value === 'center' ? AlignmentType.CENTER : value === 'left' ? AlignmentType.LEFT : value === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.RIGHT;
  function runs(node: RichNode): InstanceType<typeof TextRun>[] {
    const output: InstanceType<typeof TextRun>[] = [];
    for (const child of node.content || []) {
      if (child.type === 'hardBreak') { output.push(new TextRun({ break: 1 })); continue; }
      if (child.type !== 'text') continue;
      const styles = child.marks || [];
      const textStyle = styles.find(mark => mark.type === 'textStyle')?.attrs || {};
      const fontSize = Number.parseFloat(String(textStyle.fontSize || ''));
      const color = String(textStyle.color || '').replace(/^#/, '');
      output.push(new TextRun({
        text: child.text || '', rightToLeft: true,
        bold: styles.some(mark => mark.type === 'bold'),
        italics: styles.some(mark => mark.type === 'italic'),
        strike: styles.some(mark => mark.type === 'strike'),
        underline: styles.some(mark => mark.type === 'underline') ? {} : undefined,
        font: typeof textStyle.fontFamily === 'string' ? textStyle.fontFamily.split(',')[0].replaceAll(/["']/g, '').trim() : 'Amiri',
        size: Number.isFinite(fontSize) ? Math.round(fontSize * 1.5) : 30,
        color: /^[0-9a-fA-F]{6}$/.test(color) ? color : undefined,
      }));
    }
    return output.length ? output : [new TextRun({ text: ' ', rightToLeft: true })];
  }

  function append(node: RichNode, list?: 'bullet' | 'ordered', index = 1, quote = false) {
    if (node.type === 'pageBreak') { children.push(new Paragraph({ children: [new PageBreak()] })); return; }
    if (node.type === 'horizontalRule') { children.push(new Paragraph({ thematicBreak: true })); return; }
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      (node.content || []).forEach((item, i) => append(item, node.type === 'bulletList' ? 'bullet' : 'ordered', i + 1, quote));
      return;
    }
    if (node.type === 'listItem' || node.type === 'blockquote') {
      (node.content || []).forEach(item => append(item, node.type === 'listItem' ? list : undefined, index, node.type === 'blockquote' || quote));
      return;
    }
    if (node.type !== 'paragraph' && node.type !== 'heading') return;
    const level = Number(node.attrs?.level || 1);
    const lineHeight = Number.parseFloat(String(node.content?.find(child => child.type === 'text')?.marks?.find(mark => mark.type === 'textStyle')?.attrs?.lineHeight || '1.5'));
    const options: ParagraphOptions = {
      children: list === 'ordered' ? [new TextRun({ text: `${index}. `, rightToLeft: true }), ...runs(node)] : runs(node),
      heading: node.type === 'heading' ? level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2 : undefined,
      alignment: alignment(node.attrs?.textAlign), bidirectional: true,
      bullet: list === 'bullet' ? { level: 0 } : undefined,
      indent: quote ? { right: 540 } : undefined,
      spacing: { after: node.type === 'heading' ? 260 : 180, line: Number.isFinite(lineHeight) ? Math.round(Math.max(1, Math.min(3, lineHeight)) * 240) : 360 },
    };
    children.push(new Paragraph(options));
  }

  for (const chapter of work.chapters) {
    children.push(new Paragraph({ text: chapter.title.trim() || 'فصل بلا عنوان', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT, bidirectional: true, pageBreakBefore: true, spacing: { after: 300 } }));
    for (const node of chapterDocument(chapter.body, chapter.rich).content || []) append(node);
  }
  return Packer.toBlob(new Document({ sections: [{ children }] }));
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
