'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      reverseOrder={false}
      gutter={16}
      containerStyle={{
        position: 'fixed',
        bottom: 50,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    />
  );
}