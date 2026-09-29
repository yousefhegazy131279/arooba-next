'use client';

import { useEffect, useRef, useState } from 'react';

export function useBookDimensions(ratio = 0.707, focused = false) {
  const container = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 566, single: false });
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = () => {
      const available = Math.max(180, element.clientWidth - 24);
      const single = available < 700;
      const maxHeight = Math.max(240, Math.min(1000, window.innerHeight - (focused ? 185 : 200)));
      const width = Math.floor(Math.min(single ? available : available / 2, maxHeight * ratio));
      const height = Math.floor(width / ratio);
      setDimensions(previous => previous.width === width && previous.height === height && previous.single === single ? previous : { width, height, single });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    window.addEventListener('resize', resize);
    resize();
    return () => { observer.disconnect(); window.removeEventListener('resize', resize); };
  }, [ratio, focused]);
  return { container, ...dimensions };
}
