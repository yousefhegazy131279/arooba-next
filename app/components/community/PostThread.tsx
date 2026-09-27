'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CommunityPost } from '@/lib/community-types';
import PostCard from './PostCard';
import CommentList from './CommentList';
import styles from './Community.module.css';

export default function PostThread({ initialPost }: { initialPost: CommunityPost }) {
  const [post, setPost] = useState(initialPost);
  const router = useRouter();
  return <div className={styles.feed}><PostCard post={post} detail onChange={setPost} onDelete={() => { router.replace('/community'); router.refresh(); }} /><CommentList postId={post.id} onCountChange={delta => setPost(current => ({ ...current, comments_count: Math.max(0, current.comments_count + delta) }))} /></div>;
}
