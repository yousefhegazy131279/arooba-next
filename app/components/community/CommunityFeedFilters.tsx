'use client';

import { useState } from 'react';
import type { CommunityRole } from '@/lib/community-types';
import Feed from './Feed';
import styles from './Community.module.css';

export default function CommunityFeedFilters() {
  const [kind, setKind] = useState<CommunityRole | undefined>();
  return <div className={styles.feedColumn}><div className={styles.feedTabs} role="group" aria-label="تصفية منشورات المجتمع"><button type="button" aria-pressed={!kind} onClick={() => setKind(undefined)}>كل المجتمع</button><button type="button" aria-pressed={kind === 'writer'} onClick={() => setKind('writer')}>أعمال الكتّاب</button><button type="button" aria-pressed={kind === 'reader'} onClick={() => setKind('reader')}>حديث القرّاء</button></div><Feed kind={kind} /></div>;
}
