'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { addFavorite, removeFavorite, isFavorite } from '@/app/admin/actions';
import { showToast } from '@/lib/toast';
import styles from './CardFavoriteButton.module.css';

interface CardFavoriteButtonProps {
  novelId: string;
  onToggle?: () => void;
}

export default function CardFavoriteButton({ novelId, onToggle }: CardFavoriteButtonProps) {
  const { user, isLoggedIn } = useAuthStore();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user) {
      checkFavorite();
    }
  }, [isLoggedIn, user, novelId]);

  const checkFavorite = async () => {
    try {
      const fav = await isFavorite(user!.id, novelId);
      setIsFav(fav);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      showToast.error('يجب تسجيل الدخول لإضافة الرواية إلى المفضلة');
      return;
    }

    setLoading(true);
    try {
      if (isFav) {
        await removeFavorite(user!.id, novelId);
        setIsFav(false);
        showToast.success('تم إزالة الرواية من المفضلة');
      } else {
        await addFavorite(user!.id, novelId);
        setIsFav(true);
        showToast.success('تم إضافة الرواية إلى المفضلة');
      }
      onToggle?.();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast.error('حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${styles.favoriteBtn} ${isFav ? styles.active : ''}`}
      title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={isFav ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {loading && <span className={styles.spinner}></span>}
    </button>
  );
}