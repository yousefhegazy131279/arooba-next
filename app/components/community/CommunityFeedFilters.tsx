'use client';

import { useState } from 'react';
import type { CommunityRole } from '@/lib/community-types';
import Feed from './Feed';
import CommunityIcon from './CommunityIcon';
import styles from './Community.module.css';

const tabs: { id: CommunityRole | undefined; label: string; icon: 'users' | 'edit' | 'comment' }[] = [
  { id: undefined, label: 'كل المجتمع', icon: 'users' },
  { id: 'writer', label: 'أعمال الكتّاب', icon: 'edit' },
  { id: 'reader', label: 'حديث القرّاء', icon: 'comment' },
];

export default function CommunityFeedFilters() {
  const [kind, setKind] = useState<CommunityRole | undefined>();

  return (
    <div className={styles.feedColumn}>
      <div className={styles.feedTabs} role="group" aria-label="تصفية منشورات المجتمع">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            aria-pressed={kind === tab.id}
            onClick={() => setKind(tab.id)}
            className={styles.feedTab}
          >
            <CommunityIcon name={tab.icon} size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <Feed kind={kind} />
    </div>
  );
}