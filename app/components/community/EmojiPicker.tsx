'use client';

import { useState } from 'react';
import styles from './EmojiPicker.module.css';

const emojiData: Record<string, string[]> = {
  'وجوه مبتسمة': [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩',
    '😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨',
    '😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕',
    '🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁',
    '☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣',
    '😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','💩','🤡','👹','👺',
    '👻','👽','👾','🤖',
  ],
  'أيادي وإيماءات': [
    '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆',
    '👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅',
    '🤳','💪','🦾','👂','👃',
  ],
  'قلوب ومشاعر': [
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖',
    '💘','💝','💟','♥️','💌','💋','😍','🥰','😘','😻','💑','💏',
  ],
  'كتب وأدب': [
    '📖','📚','📕','📗','📘','📙','📓','📔','📒','📃','📜','📄','📰','🗞️','✍️','✒️',
    '🖋️','🖊️','🖌️','🖍️','🖇️','📎','📌','📍','🔖','📑','📋','📁','📂','🗂️','🗃️','🗄️',
  ],
  'رموز وشرارات': [
    '✨','⭐','🌟','💫','⚡','🔥','💥','💢','💤','💦','💨','🎭','🎨','🖼️','🎬','🎤',
    '🎧','🎼','🎵','🎶','🎷','🎸','🎹','🎺','🎻','🥁','📯','🎙️',
  ],
};

const categories = Object.keys(emojiData);

interface Props {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <div className={styles.picker} role="dialog" aria-label="منتقي الرموز">
      <div className={styles.header}>
        <div className={styles.tabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
              title={cat}
              aria-label={cat}
            >
              {emojiData[cat][0]}
            </button>
          ))}
        </div>
        {onClose && (
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="إغلاق">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.grid}>
        {emojiData[activeCategory].map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={styles.emojiBtn}
            onClick={() => onSelect(emoji)}
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}