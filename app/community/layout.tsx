import type { ReactNode } from 'react';
import styles from '@/app/components/community/Community.module.css';

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return <main className={styles.shell}>{children}</main>;
}
