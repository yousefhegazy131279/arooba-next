"use client";

import dynamic from "next/dynamic";
import type { BookReaderProps } from "./BookReader";
import styles from "./reader.module.css";

const BookReader = dynamic(() => import("./BookReader"), {
  ssr: false,
  loading: () => (
    <div className={styles.skeleton} role="status">
      <span /><span /><span /><span />
      <p>جارٍ تحميل القارئ…</p>
    </div>
  ),
});

export type ReaderClientProps = BookReaderProps & {
  wordFile?: string | null;
};

const PdfBookReader = dynamic(() => import('./PdfBookReader'), {
  ssr: false,
  loading: () => <div className={styles.skeleton} role="status"><p>جارٍ تجهيز صفحات الكتاب…</p></div>,
});

export default function ReaderClient({ wordFile, ...props }: ReaderClientProps) {
  return wordFile
    ? <PdfBookReader key={props.chapterId} fileUrl={wordFile} {...props} />
    : <BookReader key={props.chapterId} {...props} />;
}
