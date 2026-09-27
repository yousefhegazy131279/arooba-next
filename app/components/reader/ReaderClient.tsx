'use client';
import dynamic from 'next/dynamic';
import type { BookReaderProps } from './BookReader';
import styles from './reader.module.css';

const BookReader = dynamic(() => import('./BookReader'), { ssr: false, loading: () => <div className={styles.skeleton} role="status"><span /><span /><span /><span /><p>جارٍ تحميل القارئ…</p></div> });
export default function ReaderClient(props: BookReaderProps) { return <BookReader key={props.chapterId} {...props} />; }
