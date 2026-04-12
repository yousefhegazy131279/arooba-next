'use client';

import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface ToastContentProps {
  message: string;
  type: 'success' | 'error' | 'loading';
  duration: number;
  onClose: () => void;
}

function ToastContent({ message, type, duration, onClose }: ToastContentProps) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);
  const animationRef = useRef<number>(0); // ✅ تمت التهيئة بـ 0
  const startTimeRef = useRef<number>(0); // ✅ تمت التهيئة بـ 0
  const timeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ تمت التهيئة بـ null

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        cancelAnimationFrame(animationRef.current);
        handleClose();
        return;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    // مهلة احتياطية للإغلاق
    timeoutRef.current = setTimeout(() => {
      if (progress > 0) {
        handleClose();
      }
    }, duration + 100);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [duration]);

  const handleClose = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#10b981', text: '#ffffff', progress: '#ffffff' };
      case 'error':
        return { bg: '#ef4444', text: '#ffffff', progress: '#ffffff' };
      case 'loading':
        return { bg: '#ffd966', text: '#1e1e2e', progress: '#1e1e2e' };
      default:
        return { bg: '#1e1e2e', text: '#ffffff', progress: '#ffd966' };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`toast-progress ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      style={{
        background: colors.bg,
        borderRadius: '16px',
        padding: '16px 24px',
        minWidth: '380px',
        maxWidth: '450px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
        direction: 'rtl',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* الأيقونة */}
        <div style={{ flexShrink: 0, color: colors.text }}>
          {type === 'success' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {type === 'error' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {type === 'loading' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          )}
        </div>

        {/* النص وشريط التقدم */}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, marginBottom: '8px', fontSize: '1rem', fontWeight: 600, color: colors.text }}>
            {message}
          </p>
          <div
            style={{
              height: '4px',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: colors.progress,
                borderRadius: '4px',
                transition: 'width 16ms linear',
              }}
            />
          </div>
        </div>

        {/* زر الإغلاق */}
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export const showToastWithProgress = (
  message: string,
  type: 'success' | 'error' | 'loading' = 'success',
  duration: number = 4000
) => {
  const toastId = toast.custom(
    (t) => (
      <ToastContent
        message={message}
        type={type}
        duration={duration}
        onClose={() => toast.dismiss(t.id)}
      />
    ),
    { duration, position: 'bottom-center' }
  );
  return toastId;
};