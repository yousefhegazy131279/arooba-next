export type RichMark = { type: string; attrs?: Record<string, string | number | null> };
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, string | number | null>;
  marks?: RichMark[];
  content?: RichNode[];
};

export function plainToRich(body: string): RichNode {
  return {
    type: 'doc',
    content: body.split(/\r?\n/).map(line => ({
      type: 'paragraph',
      content: line ? [{ type: 'text', text: line }] : [],
    })),
  };
}

export function richToPlain(node: RichNode | null | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'pageBreak') return '';
  const separated = ['doc', 'bulletList', 'orderedList', 'blockquote', 'listItem'].includes(node.type);
  return (node.content || []).map(richToPlain).join(separated ? '\n' : '');
}

export function chapterDocument(body: string, rich: RichNode | null | undefined): RichNode {
  return rich?.type === 'doc' && Array.isArray(rich.content) ? rich : plainToRich(body);
}

export function countWords(body: string): number {
  return body.trim().match(/\S+/g)?.length || 0;
}
