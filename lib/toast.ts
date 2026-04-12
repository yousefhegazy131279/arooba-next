import toast from 'react-hot-toast';
import { showToastWithProgress } from '@/app/components/ToastWithProgress';

export const showToast = {
  success: (message: string, duration?: number) => {
    showToastWithProgress(message, 'success', duration || 4000);
  },
  error: (message: string, duration?: number) => {
    showToastWithProgress(message, 'error', duration || 5000);
  },
  loading: (message: string, duration?: number) => {
    return toast.loading(message, {
      duration: duration || 30000,
      position: 'bottom-center',
      style: {
        background: '#ffd966',
        color: '#1e1e2e',
        borderRadius: '16px',
        padding: '16px 24px',
        fontSize: '1rem',
        fontWeight: '600',
        minWidth: '350px',
        textAlign: 'center',
        direction: 'rtl',
      },
    });
  },
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};