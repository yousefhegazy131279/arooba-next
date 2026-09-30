'use client';

import { useEffect, useRef, useState } from 'react';
import { Node, type JSONContent } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { chapterDocument, richToPlain, type RichNode } from '@/lib/writerDocument';
import styles from '../Write.module.css';

const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML: () => [{ tag: 'div[data-writer-page-break]' }],
  renderHTML: () => ['div', { 'data-writer-page-break': '', class: 'writer-page-break' }],
  addKeyboardShortcuts: () => ({ 'Mod-Enter': ({ editor }) => editor.chain().focus().insertContent([{ type: 'pageBreak' }, { type: 'paragraph' }]).run() }),
});

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2] } }),
  TextStyleKit,
  TextAlign.configure({ types: ['paragraph', 'heading'], defaultAlignment: 'right' }),
  PageBreak,
];

const fonts = [
  { label: 'أميري', value: 'Amiri' },
  { label: 'شهرزاد', value: 'Scheherazade' },
  { label: 'القاهرة', value: 'Cairo' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
];

function pageBreakCount(node: RichNode): number {
  return node.type === 'pageBreak' ? 1 : (node.content || []).reduce((sum, child) => sum + pageBreakCount(child), 0);
}

type Props = {
  body: string;
  rich: RichNode | null;
  onChange: (rich: RichNode, plain: string) => void;
  readOnly?: boolean;
};

export default function WriterRichEditor({ body, rich, onChange, readOnly = false }: Props) {
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [estimatedPages, setEstimatedPages] = useState(1);
  const lastDocument = useRef('');
  const editor = useEditor({
    extensions,
    content: chapterDocument(body, rich) as JSONContent,
    immediatelyRender: false,
    editable: !readOnly,
    editorProps: { attributes: { dir: 'rtl', lang: 'ar', 'aria-label': 'نص الفصل', spellcheck: 'true', class: styles.paperBody } },
    onCreate: ({ editor: current }) => { lastDocument.current = JSON.stringify(current.getJSON()); },
    onUpdate: ({ editor: current }) => {
      const document = current.getJSON() as RichNode;
      const serialized = JSON.stringify(document);
      if (serialized === lastDocument.current) return;
      lastDocument.current = serialized;
      onChange(document, richToPlain(document));
      const bodyHeight = current.view.dom.scrollHeight;
      setEstimatedPages(Math.max(1 + pageBreakCount(document), Math.ceil(bodyHeight / 890)));
    },
    onSelectionUpdate: () => setSelectionVersion(value => value + 1),
  });

  useEffect(() => {
    if (!editor) return;
    const update = () => setEstimatedPages(Math.max(1 + pageBreakCount(editor.getJSON() as RichNode), Math.ceil(editor.view.dom.scrollHeight / 890)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(editor.view.dom);
    return () => observer.disconnect();
  }, [editor]);

  useEffect(() => { editor?.setEditable(!readOnly); }, [editor, readOnly]);

  if (!editor) return <div className={styles.paperLoading}>جارٍ تجهيز صفحة الكتابة…</div>;

  const currentFont = String(editor.getAttributes('textStyle').fontFamily || 'Amiri');
  const currentSize = String(editor.getAttributes('textStyle').fontSize || '20px').replace('px', '');
  const currentLineHeight = String(editor.getAttributes('textStyle').lineHeight || '1.9');
  const active = (name: string, attrs?: Record<string, unknown>) => editor.isActive(name, attrs);
  const tool = (label: string, run: () => void, selected = false, title?: string) =>
    <button type="button" title={title || label} aria-label={label} aria-pressed={selected} className={`${styles.tool} ${selected ? styles.toolActive : ''}`} onClick={run}>{label}</button>;

  return <div className={styles.writerWorkspace} data-selection-version={selectionVersion}>
    {!readOnly && <div className={styles.ribbon} role="toolbar" aria-label="أدوات تنسيق الفصل">
      <div className={styles.ribbonGroup}><span className={styles.ribbonLabel}>النص</span>
        <select aria-label="الخط" title="الخط" value={fonts.some(font => font.value === currentFont) ? currentFont : 'Amiri'} onChange={event => editor.chain().focus().setFontFamily(event.target.value).run()}>{fonts.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}</select>
        <select aria-label="حجم الخط" title="حجم الخط" value={['14','16','18','20','24','28','32'].includes(currentSize) ? currentSize : '20'} onChange={event => editor.chain().focus().setFontSize(`${event.target.value}px`).run()}>{[14,16,18,20,24,28,32].map(size => <option key={size} value={size}>{size}</option>)}</select>
        <select aria-label="تباعد السطور" title="تباعد السطور" value={['1.4','1.6','1.9','2.2'].includes(currentLineHeight) ? currentLineHeight : '1.9'} onChange={event => editor.chain().focus().setLineHeight(event.target.value).run()}><option value="1.4">تباعد ١٫٤</option><option value="1.6">تباعد ١٫٦</option><option value="1.9">تباعد ١٫٩</option><option value="2.2">تباعد ٢٫٢</option></select>
      </div>
      <div className={styles.ribbonGroup}><span className={styles.ribbonLabel}>النمط</span>
        {tool('عريض', () => editor.chain().focus().toggleBold().run(), active('bold'), 'عريض Ctrl+B')}
        {tool('مائل', () => editor.chain().focus().toggleItalic().run(), active('italic'), 'مائل Ctrl+I')}
        {tool('تحته خط', () => editor.chain().focus().toggleUnderline().run(), active('underline'), 'تحته خط Ctrl+U')}
        {tool('يتوسطه خط', () => editor.chain().focus().toggleStrike().run(), active('strike'))}
        <label className={styles.colorTool} title="لون النص">لون <input type="color" aria-label="لون النص" defaultValue="#242126" onChange={event => editor.chain().focus().setColor(event.target.value).run()} /></label>
      </div>
      <div className={styles.ribbonGroup}><span className={styles.ribbonLabel}>الفقرة</span>
        <select aria-label="نوع الفقرة" value={active('heading', { level: 1 }) ? 'h1' : active('heading', { level: 2 }) ? 'h2' : 'p'} onChange={event => { const value = event.target.value; if (value === 'p') editor.chain().focus().setParagraph().run(); else editor.chain().focus().setHeading({ level: value === 'h1' ? 1 : 2 }).run(); }}><option value="p">نص عادي</option><option value="h1">عنوان رئيسي</option><option value="h2">عنوان فرعي</option></select>
        {tool('يمين', () => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }))}
        {tool('توسيط', () => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }))}
        {tool('ضبط', () => editor.chain().focus().setTextAlign('justify').run(), editor.isActive({ textAlign: 'justify' }))}
        {tool('• قائمة', () => editor.chain().focus().toggleBulletList().run(), active('bulletList'))}
        {tool('١. قائمة', () => editor.chain().focus().toggleOrderedList().run(), active('orderedList'))}
        {tool('اقتباس', () => editor.chain().focus().toggleBlockquote().run(), active('blockquote'))}
      </div>
      <div className={styles.ribbonGroup}><span className={styles.ribbonLabel}>الصفحة</span>
        {tool('صفحة جديدة', () => editor.chain().focus().insertContent([{ type: 'pageBreak' }, { type: 'paragraph' }]).run(), false, 'فاصل صفحة Ctrl+Enter')}
        {tool('تراجع', () => editor.chain().focus().undo().run(), false, 'تراجع Ctrl+Z')}
        {tool('إعادة', () => editor.chain().focus().redo().run(), false, 'إعادة Ctrl+Y')}
        {tool('إزالة التنسيق', () => editor.chain().focus().unsetAllMarks().clearNodes().run())}
      </div>
    </div>}
    <div className={styles.paperDesk}>
      <div className={styles.paper}>
        <div className={styles.paperHead}><span>عُروبة / مساحة الكتابة</span><span>مسودة خاصة</span></div>
        <EditorContent editor={editor} />
        <div className={styles.paperFoot}>الفصل الجاري · {estimatedPages.toLocaleString('ar-EG')} {estimatedPages === 1 ? 'صفحة' : estimatedPages === 2 ? 'صفحتان' : 'صفحات'} تقريبًا</div>
      </div>
    </div>
    {!readOnly && <p className={styles.editorTip}>اكتب داخل الورقة. استخدم «صفحة جديدة» أو Ctrl+Enter لبدء صفحة مستقلة، وسيُحفظ الفاصل في ملف Word.</p>}
  </div>;
}
